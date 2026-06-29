<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Order matters: roles → departments/designations → users → projects/tasks.
     */
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);
        $this->call(DepartmentDesignationSeeder::class);
        $this->call(EmployeeSeeder::class);
        $this->call(ProjectTaskSeeder::class);
    }
}
