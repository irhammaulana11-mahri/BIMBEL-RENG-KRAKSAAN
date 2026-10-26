<?php

namespace App\Http\Controllers\Api\Common;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller {
    public function image(Request $request) {
        $request->validate([
            'file' => ['required','image','mimes:jpg,jpeg,png,webp','max:5120'],
            'folder' => ['nullable','string']
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

    public function document(Request $request) {
        $request->validate([
            'file'   => ['required', 'file', 'mimes:pdf,doc,docx,ppt,pptx,png,jpg,jpeg,mp4,zip', 'max:20480'], // Maksimal 20MB
            'folder' => ['nullable', 'string']
        ]);

        $folder = $request->folder ?? 'modules';
        $file   = $request->file('file');
        
        $path = $file->store($folder, 'public');

        return response()->json([
            'success' => true,
            'data'    => [
                'url'           => Storage::url($path),
                'path'          => $path,
                'original_name' => $file->getClientOriginalName(),
                'size'          => $file->getSize(),
                'extension'     => $file->getClientOriginalExtension()
            ]
        ]);
    }
}