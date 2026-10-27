<?php

namespace App\Http\Controllers\Api\Website;

use App\Http\Controllers\Controller;
use App\Http\Requests\Website\ArticleCategoryRequest;
use App\Http\Resources\Website\ArticleCategoryResource;
use App\Models\Website\ArticleCategory;

class ArticleCategoryController extends Controller {
    public function index() {
        return ArticleCategoryResource::collection(
            ArticleCategory::orderBy('category_name')
                ->get()
        );
    }

    public function store(ArticleCategoryRequest $request) {
        $category = ArticleCategory::create($request->validated());

        return new ArticleCategoryResource($category);
    }

    // Nama parameter mengikuti {article_category} agar route model binding berjalan
    public function show(ArticleCategory $articleCategory) {
        return new ArticleCategoryResource($articleCategory);
    }

    public function update(ArticleCategoryRequest $request, ArticleCategory $articleCategory) {
        $articleCategory->update($request->validated());

        return new ArticleCategoryResource($articleCategory->fresh());
    }

    public function destroy(ArticleCategory $articleCategory) {
        $articleCategory->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}