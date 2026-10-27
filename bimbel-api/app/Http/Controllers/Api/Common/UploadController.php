<?php

namespace App\Http\Controllers\Api\Common;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller {
    public function image(Request $request) {
        $request->validate([
            'file' => ['required','image','mimes:jpg,jpeg,png,webp','max:5120'],
            'folder' => ['nullable','string','max:50','regex:/^[a-z0-9_-]+$/i']
        ]);

        $folder = $request->folder ?? 'general';

        $path = $request->file('file')->store($folder,'public');
        return response()->json([
            'success' => true,
            'data' => [
                'url' => Storage::url($path),
                'path' => $path
            ]
        ]);
    }
}
