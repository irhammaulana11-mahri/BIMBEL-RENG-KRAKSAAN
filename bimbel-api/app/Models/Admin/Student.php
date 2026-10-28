<?php

namespace App\Models\Admin;

use App\Models\Admin\ParentModel;
use App\Models\Admin\User;
use App\Models\Academic\ClassRoom;
use App\Models\Academic\Schedule;
use App\Models\Academic\ScheduleStudent;
use App\Models\Admin\EducationLevel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;


class Student extends Model {
    use HasUuids;
    protected $table = 'master.students';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = ['user_id', 'full_name','nis','gender','birth_date', 'education_level','school_name','grade','is_active',
        'home_address', 'home_latitude', 'home_longitude',];

    protected $casts = [
        'birth_date'     => 'date',
        'home_latitude'  => 'float',
        'home_longitude' => 'float',
    ];
    
    
    public function user() {
        return $this->belongsTo(User::class,'user_id');
    }

    // public function parent() {
    //     return $this->belongsTo(ParentModel::class,'parent_id');
    // }

    public function parents() {
        return $this->belongsToMany(ParentModel::class,'master.parent_students','student_id','parent_id');
    }

    public function classes() {
        return $this->belongsToMany(ClassRoom::class,'academic.class_students','student_id','class_id');
    }

    public function schedules() {
        return $this->belongsToMany(Schedule::class,'academic.schedule_students','student_id','schedule_id');
    }

    public function scheduleStudents() {
        return $this->hasMany(ScheduleStudent::class,'student_id');
    }

    /**
     * Form siswa menyimpan jenjang ("SD") + kelas ("5") sebagai teks; wizard kelas menyaring
     * berdasarkan education_level_id. Keduanya disinkronkan setiap kali siswa disimpan.
     */
    protected static function booted(): void {
        static::saving(function (Student $student) {
            if ($student->isDirty('education_level_id') && $student->education_level_id && !$student->isDirty(['education_level', 'grade'])) {
                // ID dipilih langsung (mis. persetujuan pendaftaran): lengkapi teksnya bila kosong
                $level = EducationLevel::find($student->education_level_id);
                if ($level && !$student->education_level) $student->education_level = $level->education_level;
                if ($level && !$student->grade) $student->grade = (string) $level->grade_level;
                return;
            }

            if ($student->isDirty(['education_level', 'grade']) || !$student->education_level_id) {
                $student->education_level_id = self::resolveEducationLevelId($student->education_level, $student->grade)
                    ?? ($student->isDirty(['education_level', 'grade']) ? null : $student->education_level_id);
            }
        });
    }

    // "SD" + "5" / "5A" -> SD Kelas 5; "TK" + "A"/"B" -> TK Kelas A/B
    public static function resolveEducationLevelId(?string $level, ?string $grade): ?string {
        if (!$level || $grade === null || trim($grade) === '') return null;

        $grade = strtoupper(trim($grade));
        $number = preg_match('/^\d+/', $grade, $m) ? (int) $m[0] : (['A' => 1, 'B' => 2][$grade[0]] ?? null);
        if ($number === null) return null;

        return EducationLevel::whereRaw('UPPER(education_level) = ?', [strtoupper(trim($level))])
            ->where('grade_level', $number)
            ->value('id');
    }

    public function educationLevel() {
        return $this->belongsTo(EducationLevel::class,'education_level_id');
    }
    
}