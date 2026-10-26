<?php

namespace App\Models\Admin;

use Database\Factories\UserFactory;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Admin\Student;
use App\Models\Admin\ParentModel;
use App\Models\Admin\Tentor;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['role_id','name','email','phone','password','is_active'])]
#[Hidden(['password'])]

class User extends Authenticatable {
    use HasApiTokens, HasFactory, Notifiable, HasUuids; 
    
    protected $table = 'master.users';
    protected $primaryKey = 'id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected function casts(): array {
        return ['is_active' => 'boolean','password' => 'hashed',];
    }

    public function role() {
        return $this->belongsTo(Role::class,'role_id');
    }

    public function student() {
        return $this->hasOne(Student::class,'user_id');
    }

    public function parentProfile() {
        return $this->hasOne(ParentModel::class,'user_id');
    }

    public function tentor() {
        return $this->hasOne(Tentor::class,'user_id');
    }
}