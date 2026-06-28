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
        $employeeRole  = Role::where('code', 'employee')->first();

        $admin = User::updateOrCreate(
            ['email' => 'uzzal.kar@mgi.org'],
            ['name' => 'Uzzal Kar', 'employee_id' => '120292', 'password' => Hash::make('120292'), 'status' => 1, 'role_id' => $adminRole->id]
        );
        $admin->roles()->syncWithoutDetaching([$adminRole->id]);

        $manager = User::updateOrCreate(
            ['email' => 'mosiur_it@mgi.org'],
            ['name' => 'Mosiur Rahman', 'employee_id' => '001203', 'password' => Hash::make('001203'), 'status' => 1, 'role_id' => $managerRole->id]
        );
        $manager->roles()->syncWithoutDetaching([$managerRole->id]);

        $employee = User::updateOrCreate(
            ['email' => 'sharifur.rahman@mgi.org'],
            ['name' => 'Sharifur Rahman', 'employee_id' => '122287', 'password' => Hash::make('122287'), 'status' => 1, 'role_id' => $employeeRole->id]
        );
        $employee->roles()->syncWithoutDetaching([$employeeRole->id]);

        // $this->call(EmployeeSeeder::class);
        $this->call(DepartmentDesignationSeeder::class);
        $this->call(ProjectTaskSeeder::class);
    }
}
