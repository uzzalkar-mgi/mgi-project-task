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

        $employee1 = User::updateOrCreate(
            ['email' => 'sharifur.rahman@mgi.org'],
            ['name' => 'Sharifur Rahman', 'employee_id' => '122287', 'password' => Hash::make('122287'), 'status' => 1, 'role_id' => $employeeRole->id]
        );
        $employee1->roles()->syncWithoutDetaching([$employeeRole->id]);

        $employee2 = User::updateOrCreate(
            ['email' => 'zubair.tareque@mgi.org'],
            ['name' => 'Md. Zubair Bin Tareque', 'employee_id' => '097063', 'password' => Hash::make('097063'), 'status' => 1, 'role_id' => $employeeRole->id]
        );
        $employee2->roles()->syncWithoutDetaching([$employeeRole->id]);

        $employee3 = User::updateOrCreate(
            ['email' => 'asif.iqbal@mgi.org'],
            ['name' => 'Sheikh Asif Iqbal', 'employee_id' => '118210', 'password' => Hash::make('118210'), 'status' => 1, 'role_id' => $employeeRole->id]
        );
        $employee3->roles()->syncWithoutDetaching([$employeeRole->id]);

        $employee4 = User::updateOrCreate(
            ['email' => 'ishtiaque.rahman@mgi.org'],
            ['name' => 'Ishtiaque Rahman', 'employee_id' => '121442', 'password' => Hash::make('121442'), 'status' => 1, 'role_id' => $employeeRole->id]
        );
        $employee4->roles()->syncWithoutDetaching([$employeeRole->id]);

        $employee5 = User::updateOrCreate(
            ['email' => 'sina.amin@mgi.org'],
            ['name' => 'Sina Ibn Amin', 'employee_id' => '161393', 'password' => Hash::make('161393'), 'status' => 1, 'role_id' => $employeeRole->id]
        );
        $employee5->roles()->syncWithoutDetaching([$employeeRole->id]);

        // $this->call(EmployeeSeeder::class);
        $this->call(DepartmentDesignationSeeder::class);
        $this->call(ProjectTaskSeeder::class);
    }
}
