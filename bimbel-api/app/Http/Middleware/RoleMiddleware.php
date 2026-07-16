<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware {
    public function handle(Request $request,Closure $next,...$roles) {
        $user = auth()->user();
        if (!$user) {
            abort(401);
        }

        $userRole = $user->role?->role_name;
            
        if (!$userRole || !in_array($userRole,$roles)) {
            abort(403);
        }

        return $next($request);
    }
}

// namespace App\Http\Middleware;

// use Closure;
// use Illuminate\Http\Request;
// use Symfony\Component\HttpFoundation\Response;

// class RoleMiddleware {
//     public function handle(Request $request,Closure $next,string $role) {

//         $user = $request->user();

//         if (!$user) {
//             return response()->json([
//                 'message' => 'Unauthenticated'
//             ],401);
//         }

//         if ($user->role->name !== $role) {

//             return response()->json([
//                 'message' => 'Forbidden'
//             ],403);
//         }

        // return $next($request);
    // }
// }
