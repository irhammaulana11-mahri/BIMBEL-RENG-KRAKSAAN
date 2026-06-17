<?php

namespace App\Models\Website;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ArticleCategory extends Model {
    use HasUuids;
    protected $table = 'website.article_categories';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = ['category_name'];
    
    public function articles() {
        return $this->belongsToMany(
            Article::class,
            'website.article_category_relations',
            'category_id',
            'article_id'
        );
    }
    
}