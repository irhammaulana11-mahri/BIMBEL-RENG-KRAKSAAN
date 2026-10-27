<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Baseline skema yang sebelumnya dibuat manual (tanpa migration): extension uuid-ossp,
     * schema master/academic/website/exam/finance/logs, dan tabel inti (users, roles, siswa,
     * orang tua, tentor, mapel, kelas, jadwal, lokasi, konten website, log).
     *
     * Kolom yang ditambahkan migration berikutnya sengaja tidak ada di sini
     * (subjects/classes.education_level_id, tentors.rate_per_session).
     * Database lama yang sudah berisi tabel ini dilewati (tidak diubah).
     */
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public');
        foreach (['master', 'academic', 'website', 'exam', 'finance', 'logs'] as $schema) {
            DB::statement("CREATE SCHEMA IF NOT EXISTS {$schema}");
        }

        if (Schema::hasTable('master.users')) {
            return;
        }

        DB::unprepared(<<<'SQL'
CREATE TABLE academic.attendances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    schedule_id uuid NOT NULL,
    student_id uuid NOT NULL,
    attendance_date date NOT NULL,
    status character varying(20) NOT NULL,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    checkin_latitude numeric(10,8),
    checkin_longitude numeric(11,8),
    distance_meter numeric(10,2),
    attendance_photo text,
    location_valid boolean DEFAULT false,
    attendance_type character varying(20)
);
CREATE TABLE academic.class_students (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_id uuid NOT NULL,
    student_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone
);
CREATE TABLE academic.classes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    education_level character varying(20),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    code character varying(20),
    class_type character varying(30),
    max_students integer,
    is_active boolean,
    package_id uuid,
    learning_location_id uuid,
    meeting_per_month integer,
    duration_minutes integer,
    status character varying(20)
);
CREATE TABLE academic.learning_locations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    location_name character varying(150) NOT NULL,
    code character varying(30) NOT NULL,
    address text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    radius_meter integer DEFAULT 50,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    description character varying(150),
    status character varying(15)
);
CREATE TABLE academic.schedule_students (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    schedule_id uuid NOT NULL,
    student_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE academic.schedules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tentor_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    class_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    learning_location_id uuid,
    room_name character varying(100),
    meeting_url text,
    is_active boolean
);
CREATE TABLE logs.activity_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    activity text,
    ip_address character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE logs.wa_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    recipient character varying(20),
    message text,
    status character varying(20),
    sent_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE master.parent_students (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    parent_id uuid NOT NULL,
    student_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE master.parents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    full_name character varying(100) NOT NULL,
    occupation character varying(100),
    relationship character varying(50),
    address text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE master.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    role_name character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
CREATE TABLE master.students (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    nis character varying(30) NOT NULL,
    gender character varying(10),
    birth_date date,
    school_name character varying(150),
    grade character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    photo character varying(255),
    full_name character varying(150),
    education_level character varying(30),
    education_level_id uuid
);
CREATE TABLE master.subjects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean
);
CREATE TABLE master.tentor_subjects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tentor_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone
);
CREATE TABLE master.tentors (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    specialization character varying(100),
    education character varying(150),
    joining_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    nik character varying(30),
    gender character varying(20),
    birth_date date,
    address text,
    is_active boolean DEFAULT true,
    photo character varying(255)
);
CREATE TABLE master.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    role_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100),
    phone character varying(20),
    password character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
CREATE TABLE website.activities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    activity_date date,
    location character varying(200),
    cover_image text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);
CREATE TABLE website.activity_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    activity_id uuid NOT NULL,
    image_url text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE website.article_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    category_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone
);
CREATE TABLE website.article_category_relations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    article_id uuid NOT NULL,
    category_id uuid NOT NULL
);
CREATE TABLE website.articles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(250) NOT NULL,
    slug character varying(300) NOT NULL,
    summary text,
    content text NOT NULL,
    featured_image text,
    author_id uuid,
    publish_date timestamp without time zone,
    view_count integer DEFAULT 0,
    is_published boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE website.banners (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(200),
    subtitle text,
    image_url text NOT NULL,
    button_text character varying(100),
    button_link text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    start_date date,
    end_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE website.company_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_name character varying(200),
    address text,
    phone character varying(30),
    whatsapp character varying(30),
    email character varying(100),
    website_url text,
    facebook_url text,
    instagram_url text,
    youtube_url text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    logo_url text
);
CREATE TABLE website.faqs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone
);
CREATE TABLE website.leads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    parent_name character varying(150) NOT NULL,
    phone character varying(30) NOT NULL,
    education_level character varying(50) NOT NULL,
    package_id uuid,
    notes text,
    status character varying(30) DEFAULT 'new'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    student_name character varying(150) DEFAULT ''::character varying NOT NULL,
    user_id uuid,
    email character varying(100)
);
CREATE TABLE website.packages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    package_name character varying(150) NOT NULL,
    education_level character varying(50),
    description text,
    default_price numeric(15,2),
    meeting_per_month integer,
    duration_minutes integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    package_code character varying(20),
    class_type character varying(30),
    display_order integer DEFAULT 0
);
CREATE TABLE website.testimonials (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_name character varying(150),
    school_name character varying(150),
    testimonial text,
    photo_url text,
    rating integer DEFAULT 5,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone
);
ALTER TABLE ONLY academic.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);
ALTER TABLE ONLY academic.class_students
    ADD CONSTRAINT class_students_pkey PRIMARY KEY (id);
ALTER TABLE ONLY academic.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY academic.learning_locations
    ADD CONSTRAINT learning_locations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY academic.schedule_students
    ADD CONSTRAINT schedule_students_pkey PRIMARY KEY (id);
ALTER TABLE ONLY academic.schedules
    ADD CONSTRAINT schedules_pkey PRIMARY KEY (id);
ALTER TABLE ONLY academic.learning_locations
    ADD CONSTRAINT uq_learning_locations_code UNIQUE (code);
ALTER TABLE ONLY logs.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY logs.wa_logs
    ADD CONSTRAINT wa_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY master.parent_students
    ADD CONSTRAINT parent_students_pkey PRIMARY KEY (id);
ALTER TABLE ONLY master.parents
    ADD CONSTRAINT parents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY master.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY master.students
    ADD CONSTRAINT students_nis_key UNIQUE (nis);
ALTER TABLE ONLY master.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);
ALTER TABLE ONLY master.subjects
    ADD CONSTRAINT subjects_code_key UNIQUE (code);
ALTER TABLE ONLY master.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);
ALTER TABLE ONLY master.tentor_subjects
    ADD CONSTRAINT tutor_subjects_pkey PRIMARY KEY (id);
ALTER TABLE ONLY master.tentors
    ADD CONSTRAINT tutors_pkey PRIMARY KEY (id);
ALTER TABLE ONLY master.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY master.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY website.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);
ALTER TABLE ONLY website.activity_images
    ADD CONSTRAINT activity_images_pkey PRIMARY KEY (id);
ALTER TABLE ONLY website.article_categories
    ADD CONSTRAINT article_categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY website.article_category_relations
    ADD CONSTRAINT article_category_relations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY website.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY website.articles
    ADD CONSTRAINT articles_slug_key UNIQUE (slug);
ALTER TABLE ONLY website.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);
ALTER TABLE ONLY website.company_profiles
    ADD CONSTRAINT company_profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY website.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY website.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);
ALTER TABLE ONLY website.packages
    ADD CONSTRAINT packages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY website.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);
ALTER TABLE ONLY website.packages
    ADD CONSTRAINT uq_packages_package_code UNIQUE (package_code);
CREATE INDEX idx_attendance_date ON academic.attendances USING btree (attendance_date);
CREATE INDEX idx_classes_class_type ON academic.classes USING btree (class_type);
CREATE INDEX idx_classes_education_level ON academic.classes USING btree (education_level);
CREATE INDEX idx_classes_is_active ON academic.classes USING btree (is_active);
CREATE INDEX idx_classes_learning_location ON academic.classes USING btree (learning_location_id);
CREATE INDEX idx_classes_level_type ON academic.classes USING btree (education_level, class_type);
CREATE INDEX idx_classes_package ON academic.classes USING btree (package_id);
CREATE INDEX idx_learning_locations_is_active ON academic.learning_locations USING btree (is_active);
CREATE INDEX idx_learning_locations_name ON academic.learning_locations USING btree (location_name);
CREATE INDEX idx_schedules_class ON academic.schedules USING btree (class_id);
CREATE INDEX idx_schedules_day ON academic.schedules USING btree (day_of_week);
CREATE INDEX idx_schedules_day_start ON academic.schedules USING btree (day_of_week, start_time);
CREATE INDEX idx_schedules_is_active ON academic.schedules USING btree (is_active);
CREATE INDEX idx_schedules_location ON academic.schedules USING btree (learning_location_id);
CREATE INDEX idx_schedules_subject ON academic.schedules USING btree (subject_id);
CREATE INDEX idx_schedules_tentor ON academic.schedules USING btree (tentor_id);
CREATE INDEX idx_students_nis ON master.students USING btree (nis);
CREATE INDEX idx_users_email ON master.users USING btree (email);
CREATE INDEX idx_users_phone ON master.users USING btree (phone);
CREATE INDEX idx_packages_class_type ON website.packages USING btree (class_type);
CREATE INDEX idx_packages_education_level ON website.packages USING btree (education_level);
CREATE INDEX idx_packages_is_active ON website.packages USING btree (is_active);
CREATE INDEX idx_packages_name ON website.packages USING btree (package_name);
ALTER TABLE ONLY academic.attendances
    ADD CONSTRAINT fk_att_schedule FOREIGN KEY (schedule_id) REFERENCES academic.schedules(id);
ALTER TABLE ONLY academic.attendances
    ADD CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES master.students(id);
ALTER TABLE ONLY academic.class_students
    ADD CONSTRAINT fk_class_student_class FOREIGN KEY (class_id) REFERENCES academic.classes(id) ON DELETE CASCADE;
ALTER TABLE ONLY academic.class_students
    ADD CONSTRAINT fk_class_student_student FOREIGN KEY (student_id) REFERENCES master.students(id) ON DELETE CASCADE;
ALTER TABLE ONLY academic.classes
    ADD CONSTRAINT fk_classes_learning_location FOREIGN KEY (learning_location_id) REFERENCES academic.learning_locations(id) ON DELETE SET NULL;
ALTER TABLE ONLY academic.classes
    ADD CONSTRAINT fk_classes_package FOREIGN KEY (package_id) REFERENCES website.packages(id) ON DELETE SET NULL;
ALTER TABLE ONLY academic.schedules
    ADD CONSTRAINT fk_schedule_class FOREIGN KEY (class_id) REFERENCES academic.classes(id);
ALTER TABLE ONLY academic.schedules
    ADD CONSTRAINT fk_schedule_location FOREIGN KEY (learning_location_id) REFERENCES academic.learning_locations(id);
ALTER TABLE ONLY academic.schedules
    ADD CONSTRAINT fk_schedule_subject FOREIGN KEY (subject_id) REFERENCES master.subjects(id);
ALTER TABLE ONLY academic.schedules
    ADD CONSTRAINT fk_schedule_tutor FOREIGN KEY (tentor_id) REFERENCES master.tentors(id);
ALTER TABLE ONLY academic.schedules
    ADD CONSTRAINT fk_schedules_class FOREIGN KEY (class_id) REFERENCES academic.classes(id) ON DELETE CASCADE;
ALTER TABLE ONLY academic.schedules
    ADD CONSTRAINT fk_schedules_learning_location FOREIGN KEY (learning_location_id) REFERENCES academic.learning_locations(id) ON DELETE SET NULL;
ALTER TABLE ONLY academic.schedules
    ADD CONSTRAINT fk_schedules_subject FOREIGN KEY (subject_id) REFERENCES master.subjects(id) ON DELETE RESTRICT;
ALTER TABLE ONLY academic.schedules
    ADD CONSTRAINT fk_schedules_tentor FOREIGN KEY (tentor_id) REFERENCES master.tentors(id) ON DELETE RESTRICT;
ALTER TABLE ONLY academic.schedule_students
    ADD CONSTRAINT fk_ss_schedule FOREIGN KEY (schedule_id) REFERENCES academic.schedules(id) ON DELETE CASCADE;
ALTER TABLE ONLY academic.schedule_students
    ADD CONSTRAINT fk_ss_student FOREIGN KEY (student_id) REFERENCES master.students(id) ON DELETE CASCADE;
ALTER TABLE ONLY logs.activity_logs
    ADD CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES master.users(id);
ALTER TABLE ONLY master.parents
    ADD CONSTRAINT fk_parent_user FOREIGN KEY (user_id) REFERENCES master.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY master.parent_students
    ADD CONSTRAINT fk_ps_parent FOREIGN KEY (parent_id) REFERENCES master.parents(id) ON DELETE CASCADE;
ALTER TABLE ONLY master.parent_students
    ADD CONSTRAINT fk_ps_student FOREIGN KEY (student_id) REFERENCES master.students(id) ON DELETE CASCADE;
ALTER TABLE ONLY master.students
    ADD CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES master.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY master.tentor_subjects
    ADD CONSTRAINT fk_tutor_subject_subject FOREIGN KEY (subject_id) REFERENCES master.subjects(id) ON DELETE CASCADE;
ALTER TABLE ONLY master.tentor_subjects
    ADD CONSTRAINT fk_tutor_subject_tutor FOREIGN KEY (tentor_id) REFERENCES master.tentors(id) ON DELETE CASCADE;
ALTER TABLE ONLY master.tentors
    ADD CONSTRAINT fk_tutor_user FOREIGN KEY (user_id) REFERENCES master.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY master.users
    ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES master.roles(id);
ALTER TABLE ONLY website.article_category_relations
    ADD CONSTRAINT fk_acr_article FOREIGN KEY (article_id) REFERENCES website.articles(id) ON DELETE CASCADE;
ALTER TABLE ONLY website.article_category_relations
    ADD CONSTRAINT fk_acr_category FOREIGN KEY (category_id) REFERENCES website.article_categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY website.activity_images
    ADD CONSTRAINT fk_activity_image FOREIGN KEY (activity_id) REFERENCES website.activities(id) ON DELETE CASCADE;
ALTER TABLE ONLY website.articles
    ADD CONSTRAINT fk_article_author FOREIGN KEY (author_id) REFERENCES master.users(id);
ALTER TABLE ONLY website.leads
    ADD CONSTRAINT fk_lead_package FOREIGN KEY (package_id) REFERENCES website.packages(id);
SQL);
    }

    public function down(): void
    {
        foreach ([
            'logs.wa_logs', 'logs.activity_logs',
            'website.article_category_relations', 'website.article_categories', 'website.articles',
            'website.activity_images', 'website.activities', 'website.banners', 'website.company_profiles',
            'website.faqs', 'website.leads', 'website.testimonials',
            'academic.attendances', 'academic.schedule_students', 'academic.schedules', 'academic.class_students',
            'academic.classes', 'academic.learning_locations', 'website.packages',
            'master.tentor_subjects', 'master.parent_students', 'master.parents', 'master.students',
            'master.tentors', 'master.subjects', 'master.users', 'master.roles',
        ] as $table) {
            DB::statement("DROP TABLE IF EXISTS {$table} CASCADE");
        }
    }
};
