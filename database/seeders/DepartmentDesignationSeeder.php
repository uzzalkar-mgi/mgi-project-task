<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Designation;
use App\Models\User;
use Illuminate\Database\Seeder;

class DepartmentDesignationSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            'Information Technology', 'Sales', 'Marketing', 'Human Resources', 'Account', 'Administrator',
        ];

        foreach ($departments as $department) {
            Department::query()->updateOrCreate(['name' => $department], ['status' => 1]);
        }

        $designations = ['Assistant General Manager', 'Deputy Manager', 'Assistant Manager', 'Manager', 'Executive', 'Senior Executive'];
        foreach ($designations as $designation) {
            Designation::query()->updateOrCreate(['name' => $designation], ['status' => 1]);
        }

        // Assign sensible defaults to existing users that have none.
        $it = Department::query()->where('name', 'Information Technology')->first();

        // Explicit assignments for the core accounts (by employee_id) — all Information Technology.
        $assignments = [
            '120292' => 'Assistant Manager',          // Uzzal Kar (admin)
            '122287' => 'Deputy Manager',             // Sharifur Rahman (employee)
            '001203' => 'Assistant General Manager',  // Mosiur Rahman (manager)
        ];

        foreach ($assignments as $empId => $designationName) {
            $designation = Designation::query()->where('name', $designationName)->first();
            User::query()->where('employee_id', $empId)->update([
                'department_id'  => $it->id,
                'designation_id' => $designation?->id,
            ]);
        }
    }
}
