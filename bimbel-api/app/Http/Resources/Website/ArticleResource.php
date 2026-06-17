<?php

namespace App\Http\Resources\Website;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'content' => $this->content,
            'featured_image' => $this->featured_image,
            'publish_date' => $this->publish_date,
            'view_count' => $this->view_count,
            'is_published' => $this->is_published,
            'author' => [
                'id' => $this->author?->id,
                'name' => $this->author?->name,
            ],

            'categories' =>
                ArticleCategoryResource::collection(
                    $this->whenLoaded('categories')
                )
        ];
    }
}