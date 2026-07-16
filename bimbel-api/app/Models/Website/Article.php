<?php

namespace App\Models\Website;

use App\Models\Admin\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Article extends Model {
    use HasUuids;
    protected $table = 'website.articles';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = [
        'title',
        'slug',
        'summary',
        'content',
        'featured_image',
        'author_id',
        'publish_date',
        'view_count',
        'is_published'
    ];

    protected $casts = [
        'publish_date' => 'datetime',
        'is_published' => 'boolean',
        'view_count' => 'integer'
    ];

    public function author() {
        return $this->belongsTo(User::class,'author_id');
    }

    public function categories() {
        return $this->belongsToMany(ArticleCategory::class,'website.article_category_relations','article_id','category_id');
    }
}