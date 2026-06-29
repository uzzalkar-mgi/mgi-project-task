<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function index(): Response
    {
        $this->authorize('permission', 'roles.view');

        $roles = Role::withCount(['users', 'permissions'])->orderBy('id')->get()
            ->map(fn (Role $r) => [
                'id'                => $r->id,
                'name'             => $r->name,
                'code'             => $r->code,
                'is_super'         => $r->is_super,
                'status'           => $r->status,
                'users_count'      => $r->users_count,
                'permissions_count' => $r->permissions_count,
            ]);

        return Inertia::render('Roles/Index', ['roles' => $roles]);
    }

    public function create(): Response
    {
        $this->authorize('permission', 'roles.create');

        return Inertia::render('Roles/Form', [
            'role'   => null,
            'modules' => $this->permissionMatrix(),
            'assigned' => [],
        ]);
    }

    public function edit(Role $role): Response
    {
        $this->authorize('permission', 'roles.update');

        return Inertia::render('Roles/Form', [
            'role'     => ['id' => $role->id, 'name' => $role->name, 'code' => $role->code, 'is_super' => $role->is_super, 'status' => $role->status],
            'modules'  => $this->permissionMatrix(),
            'assigned' => $role->permissions()->pluck('permissions.id'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('permission', 'roles.create');

        $data = $this->validateRole($request);
        $role = Role::create([
            'name'     => $data['name'],
            'code'     => $data['code'] ?: Str::slug($data['name']),
            'is_super' => $data['is_super'] ?? false,
            'status'   => $data['status'] ?? 1,
        ]);
        $role->permissions()->sync($data['permission_ids'] ?? []);

        return redirect()->route('roles.index')->with('status', 'Role created.');
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $this->authorize('permission', 'roles.update');

        $data = $this->validateRole($request, $role);
        $role->update([
            'name'     => $data['name'],
            'code'     => $data['code'] ?: $role->code,
            'is_super' => $data['is_super'] ?? false,
            'status'   => $data['status'] ?? 1,
        ]);
        $role->permissions()->sync($data['permission_ids'] ?? []);

        // Bust cached permissions for everyone holding this role.
        $role->users->each->flushPermissionCache();

        return redirect()->route('roles.index')->with('status', 'Role updated.');
    }

    public function toggleStatus(Role $role): RedirectResponse
    {
        $this->authorize('permission', 'roles.update');
        $role->toggleStatus();

        return back();
    }

    public function destroy(Role $role): RedirectResponse
    {
        $this->authorize('permission', 'roles.delete');

        abort_if(in_array($role->code, ['super_admin', 'admin', 'manager', 'employee']), 403, 'Core roles cannot be deleted.');
        $role->delete();

        return redirect()->route('roles.index')->with('status', 'Role deleted.');
    }

    private function validateRole(Request $request, ?Role $role = null): array
    {
        return $request->validate([
            'name'           => ['required', 'string', 'max:255', Rule::unique('roles')->ignore($role?->id)],
            'code'           => ['nullable', 'string', 'max:255', Rule::unique('roles')->ignore($role?->id)],
            'is_super'       => ['boolean'],
            'status'         => ['integer', 'in:0,1'],
            'permission_ids' => ['array'],
            'permission_ids.*' => ['exists:permissions,id'],
        ]);
    }

    /** Permissions grouped by module for the assignment matrix. */
    private function permissionMatrix(): array
    {
        $perms = Permission::orderBy('module')->orderBy('id')->get();

        return collect(RolePermissionSeeder::MODULES)->map(function ($cfg, $module) use ($perms) {
            return [
                'module' => $module,
                'label'  => $cfg['label'],
                'permissions' => $perms->where('module', $module)->map(fn ($p) => [
                    'id'     => $p->id,
                    'action' => $p->action,
                ])->values(),
            ];
        })->values()->all();
    }
}
