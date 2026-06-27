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
        $map = [
            'Information Technology' => ['Software Engineer', 'Senior Software Engineer', 'Team Lead', 'Project Manager'],
            'Sales'                  => ['Sales Executive', 'Area Sales Manager', 'Regional Sales Manager'],
            'Marketing'              => ['Marketing Officer', 'Brand Manager'],
            'Human Resources'        => ['HR Officer', 'HR Manager'],
            'Finance'                => ['Accountant', 'Finance Manager'],
        ];

        foreach ($map as $dept => $designations) {
            $department = Department::updateOrCreate(['name' => $dept], ['status' => 1]);
            foreach ($designations as $d) {
                Designation::updateOrCreate(
                    ['name' => $d],
                    ['department_id' => $department->id, 'status' => 1]
                );
            }
        }

        // Assign sensible defaults to existing users that have none.
        $it      = Department::where('name', 'Information Technology')->first();
        $sales   = Department::where('name', 'Sales')->first();
        $pm      = Designation::where('name', 'Project Manager')->first();
        $se      = Designation::where('name', 'Software Engineer')->first();
        $asm     = Designation::where('name', 'Area Sales Manager')->first();

        User::whereNull('department_id')->get()->each(function (User $u) use ($it, $sales, $pm, $se, $asm) {
            $isManager = $u->roles->contains(fn ($r) => in_array($r->code, ['admin', 'manager']));
            $u->department_id  = $isManager ? $it->id : $sales->id;
            $u->designation_id = $isManager ? $pm->id : ($u->department_id === $it->id ? $se->id : $asm->id);
            $u->save();
        });
    }
}
