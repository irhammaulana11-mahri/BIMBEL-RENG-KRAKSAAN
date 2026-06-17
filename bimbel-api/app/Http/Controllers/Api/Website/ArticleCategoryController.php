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

    public function show(ArticleCategory $category) {
        return new ArticleCategoryResource($category);
    }

    public function update(ArticleCategoryRequest $request,ArticleCategory $category) {
        $category->update($request->validated());

        return new ArticleCategoryResource($category->fresh());
    }

    public function destroy(ArticleCategory $category) {
        $category->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}