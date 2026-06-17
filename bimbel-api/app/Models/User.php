<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Student;
use App\Models\ParentModel;
use App\Models\Tutor;

#[Fillable(['role_id','name','email','phone','password','is_active'])]
#[Hidden(['password'])]

class User extends Authenticatable {
    use HasApiTokens, HasFactory, Notifiable;
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

    public function tutorProfile() {
        return $this->hasOne(Tutor::class,'user_id');
    }
}