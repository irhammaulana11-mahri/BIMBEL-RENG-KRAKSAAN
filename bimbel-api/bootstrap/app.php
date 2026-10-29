<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
     ->withMiddleware(function ($middleware) {
        $middleware->append(HandleCors::class);
    })
    ->withMiddleware(function (Middleware $middleware): void {
        // Kunci API selama pemulihan backup berjalan
        $middleware->api(append: [\App\Http\Middleware\BlockDuringRestore::class]);

        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);

        // Peran dicek sebelum route model binding: peran salah selalu 403, tanpa membocorkan ada/tidaknya data
        $middleware->prependToPriorityList(
            before: \Illuminate\Routing\Middleware\SubstituteBindings::class,
            prepend: \App\Http\Middleware\RoleMiddleware::class,
        );
        
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Data ganda yang lolos ke constraint DB (mis. dua proses bersamaan): pesan jelas, bukan 500.
        // Exception tetap dicatat di log.
        $exceptions->render(function (\Illuminate\Database\UniqueConstraintViolationException $e, Request $request) {
            if (!$request->is('api/*')) return null;
            return response()->json([
                'success' => false,
                'message' => 'Data yang sama sudah tercatat atau sedang diproses. Muat ulang halaman lalu periksa kembali.',
            ], 422);
        });
    })->create();
