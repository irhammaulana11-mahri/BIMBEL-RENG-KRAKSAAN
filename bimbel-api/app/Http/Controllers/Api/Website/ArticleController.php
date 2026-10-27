<?php

namespace App\Http\Controllers\Api\Website;

use App\Http\Controllers\Api\Website\Concerns\PublicVisibility;

use Str;
use App\Models\Website\Article;
use App\Http\Controllers\Controller;
use App\Http\Requests\Website\ArticleRequest;
use App\Http\Resources\Website\ArticleResource;


class ArticleController extends Controller {
    use PublicVisibility;

    public function index() {
        return ArticleResource::collection(
            Article::with([
                'author',
                'categories'
            ])
            // Publik: hanya artikel terbit yang tanggal terbitnya sudah tiba
            ->when(!$this->viewerIsCmsAdmin(), fn($q) => $q->where('is_published', true)
                ->where(fn($d) => $d->whereNull('publish_date')->orWhere('publish_date', '<=', now())))
            ->latest()
            ->get()
        );
    }

    public function store(ArticleRequest $request) {
        $data = $request->validated();

        $article = Article::create([
            ...$data,
            'author_id' => auth()->id(),

            'slug' => Str::slug(
                $data['title']
            ),

            'view_count' => 0
        ]);

        if(isset($data['categories'])) {
            $article->categories()->sync($data['categories']);
        }

        return new ArticleResource($article->load(['author','categories']));
    }

    public function show(Article $article) {
        abort_if(!$article->is_published && !$this->viewerIsCmsAdmin(), 404);
        $article->increment('view_count');

        return new ArticleResource($article->load(['author','categories']));
    }

    public function update(ArticleRequest $request,Article $article) {
        $data = $request->validated();

        $article->update([
            ...$data,

            'slug' => Str::slug(
                $data['title']
            ),
            // 'author_id' => $article->author_id
        ]);

        if(isset($data['categories'])) {
            $article->categories()->sync($data['categories']);
        }

        return new ArticleResource($article->load(['author','categories']));
    }

    public function destroy(Article $article) {
        $article->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    public function showBySlug($slug)
    {
        $article = Article::with([
            'author',
            'categories'
        ])
        ->where('slug',$slug)
        ->when(!$this->viewerIsCmsAdmin(), fn($q) => $q->where('is_published', true)
            ->where(fn($d) => $d->whereNull('publish_date')->orWhere('publish_date', '<=', now())))
        ->firstOrFail();

        $article->increment('view_count');

        return new ArticleResource($article);
    }
}