<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);

        $adminRole   = Role::where('code', 'admin')->first();
        $managerRole = Role::where('code', 'manager')->first();
        $memberRole  = Role::where('code', 'member')->first();

        $admin = User::updateOrCreate(
            ['email' => 'admin@mgi.org'],
            ['name' => 'PTS Admin', 'employee_id' => 'MGI-0001', 'password' => Hash::make('password'), 'status' => 1, 'role_id' => $adminRole->id]
        );
        $admin->roles()->syncWithoutDetaching([$adminRole->id]);

        $manager = User::updateOrCreate(
            ['email' => 'manager@mgi.org'],
            ['name' => 'Sample Manager', 'employee_id' => 'MGI-0002', 'password' => Hash::make('password'), 'status' => 1, 'role_id' => $managerRole->id]
        );
        $manager->roles()->syncWithoutDetaching([$managerRole->id]);

        $member = User::updateOrCreate(
            ['email' => 'member@mgi.org'],
            ['name' => 'Sample Member', 'employee_id' => 'MGI-0003', 'password' => Hash::make('password'), 'status' => 1, 'role_id' => $memberRole->id]
        );
        $member->roles()->syncWithoutDetaching([$memberRole->id]);

        $this->call(EmployeeSeeder::class);
        $this->call(DepartmentDesignationSeeder::class);
        $this->call(ProjectTaskSeeder::class);
    }
}
