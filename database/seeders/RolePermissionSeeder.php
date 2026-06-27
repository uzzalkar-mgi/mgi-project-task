<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RolePermissionSeeder extends Seeder
{
    /**
     * Module x action permission catalogue. `menu` drives sidebar visibility;
     * the rest gate controller actions. Roles are assigned subsets of these
     * (Admin is super-admin and implicitly holds all via Gate::before).
     */
    public const MODULES = [
        'dashboard'  => ['actions' => ['menu', 'view'],                                'label' => 'Dashboard'],
        'projects'   => ['actions' => ['menu', 'view', 'create', 'update', 'delete'],  'label' => 'Projects'],
        'tasks'      => ['actions' => ['menu', 'view', 'create', 'update', 'delete', 'assign'], 'label' => 'Tasks'],
        'timeline'   => ['actions' => ['menu', 'view'],                                'label' => 'Timeline'],
        'milestones' => ['actions' => ['menu', 'view', 'create', 'update', 'delete'],  'label' => 'Milestones'],
        'users'      => ['actions' => ['menu', 'view', 'create', 'update', 'delete', 'manage'], 'label' => 'Team / Users'],
        'roles'      => ['actions' => ['menu', 'view', 'create', 'update', 'delete'],  'label' => 'Roles & Permissions'],
        'departments'  => ['actions' => ['menu', 'view', 'create', 'update', 'delete'], 'label' => 'Departments'],
        'designations' => ['actions' => ['menu', 'view', 'create', 'update', 'delete'], 'label' => 'Designations'],
    ];

    public function run(): void
    {
        // ---- Build full permission catalogue ----------------------------
        foreach (self::MODULES as $module => $cfg) {
            foreach ($cfg['actions'] as $action) {
                Permission::updateOrCreate(
                    ['name' => "{$module}.{$action}"],
                    [
                        'module' => $module,
                        'action' => $action,
                        'guard'  => 'backend',
                        'label'  => $cfg['label'].' — '.Str::headline($action),
                    ]
                );
            }
        }

        // ---- Roles --------------------------------------------------------
        $admin   = Role::updateOrCreate(['code' => 'admin'],   ['name' => 'Admin',   'is_super' => true,  'status' => 1]);
        $manager = Role::updateOrCreate(['code' => 'manager'], ['name' => 'Manager', 'is_super' => false, 'status' => 1]);
        $member  = Role::updateOrCreate(['code' => 'member'],  ['name' => 'Member',  'is_super' => false, 'status' => 1]);

        // Manager: everything except admin modules (users, roles, departments, designations).
        $managerPerms = Permission::whereNotIn('module', ['users', 'roles', 'departments', 'designations'])->pluck('id');

        // Member: view projects/timeline/milestones; work on tasks; personal dashboard.
        $memberPerms = Permission::whereIn('name', [
            'dashboard.menu', 'dashboard.view',
            'projects.menu', 'projects.view',
            'tasks.menu', 'tasks.view', 'tasks.create', 'tasks.update',
            'timeline.menu', 'timeline.view',
            'milestones.menu', 'milestones.view',
        ])->pluck('id');

        $manager->permissions()->sync($managerPerms);
        $member->permissions()->sync($memberPerms);
        $admin->permissions()->sync(Permission::pluck('id')); // explicit grant too (super bypass anyway)
    }
}
