<?php

namespace App\Services;

use Aws\S3\S3Client;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class ImageService
{
    private ?S3Client $client = null;
    private array $cfg;

    public function __construct()
    {
        $this->cfg = config('filesystems.disks.gcs');
    }

    /**
     * GCS-safe S3 client. We talk to it directly (not through Flysystem/Laravel
     * disk) because:
     *   - GCS uniform-access buckets 400 on the ACL header Flysystem sends.
     *   - Laravel's disk resolver drops the checksum options GCS needs.
     */
    private function client(): S3Client
    {
        return $this->client ??= new S3Client([
            'version'                 => 'latest',
            'region'                  => $this->cfg['region'] ?? 'auto',
            'endpoint'                => $this->cfg['endpoint'] ?? 'https://storage.googleapis.com',
            'use_path_style_endpoint' => true,
            'credentials'             => [
                'key'    => $this->cfg['key'],
                'secret' => $this->cfg['secret'],
            ],
            'request_checksum_calculation' => 'when_required',
            'response_checksum_validation' => 'when_required',
        ]);
    }

    private function key(string $path): string
    {
        $root = trim($this->cfg['root'] ?? '', '/');

        return ($root ? $root.'/' : '').ltrim($path, '/');
    }

    /**
     * Upload an image and return its path + public URL.
     *
     * @return array{path: string, url: string, name: string, size: int}
     */
    public function upload(UploadedFile $file, string $folder = 'images'): array
    {
        $ext  = strtolower($file->getClientOriginalExtension() ?: ($file->guessExtension() ?: 'bin'));
        $name = Str::uuid()->toString().'.'.$ext;
        $path = trim($folder, '/').'/'.$name;

        $this->put($path, [
            'Body'        => fopen($file->getRealPath(), 'r'),
            'ContentType' => $file->getMimeType() ?: 'application/octet-stream',
        ]);

        return [
            'path' => $path,
            'url'  => $this->url($path),
            'name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
        ];
    }

    /** Store raw bytes at a given path (tests / non-request callers). */
    public function putRaw(string $contents, string $path, ?string $contentType = null): array
    {
        $this->put($path, [
            'Body'        => $contents,
            'ContentType' => $contentType ?: 'application/octet-stream',
        ]);

        return ['path' => $path, 'url' => $this->url($path)];
    }

    /**
     * Put an object, adding ACL public-read when visibility=public.
     * If the bucket has uniform access ON (ACL rejected), retry WITHOUT the
     * ACL so the upload still succeeds — the object just won't be per-object
     * public (make the bucket public via IAM instead).
     */
    private function put(string $path, array $extra): void
    {
        $base = [
            'Bucket' => $this->cfg['bucket'],
            'Key'    => $this->key($path),
            ...$extra,
        ];
        $public = ($this->cfg['visibility'] ?? 'private') === 'public';

        if (! $public) {
            $this->client()->putObject($base);
            return;
        }

        try {
            $this->client()->putObject([...$base, 'ACL' => 'public-read']);
        } catch (\Aws\S3\Exception\S3Exception $e) {
            // ACL rejected (likely uniform bucket-level access ON) → retry without it.
            if (is_resource($extra['Body'] ?? null)) {
                rewind($extra['Body']);
            }
            $this->client()->putObject($base);
        }
    }

    /** Permanent public URL — only reachable if the bucket grants allUsers objectViewer. */
    public function url(string $path): string
    {
        $base = rtrim($this->cfg['endpoint'] ?? 'https://storage.googleapis.com', '/');

        return $base.'/'.$this->cfg['bucket'].'/'.$this->key($path);
    }

    /** Signed, time-limited URL — works even on a private bucket. */
    public function signedUrl(string $path, string $expires = '+1 hour'): string
    {
        $cmd = $this->client()->getCommand('GetObject', [
            'Bucket' => $this->cfg['bucket'],
            'Key'    => $this->key($path),
        ]);

        return (string) $this->client()->createPresignedRequest($cmd, $expires)->getUri();
    }

    public function exists(string $path): bool
    {
        return $this->client()->doesObjectExist($this->cfg['bucket'], $this->key($path));
    }

    public function delete(string $path): bool
    {
        $this->client()->deleteObject([
            'Bucket' => $this->cfg['bucket'],
            'Key'    => $this->key($path),
        ]);

        return true;
    }
}
