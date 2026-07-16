<?php

namespace App\Models\Admin;

use App\Models\Admin\User;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $table = 'master.roles';
    protected $primaryKey = 'id';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = ['role_name'];

    public function users() {
        return $this->hasMany(User::class,'role_id');
    }
}