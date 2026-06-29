<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Designation;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EmployeeSeeder extends Seeder
{
    /**
     * Seeds the real MGI accounts. Department/designation resolved by name,
     * role by code — robust against differing ids across environments.
     * Password = employee_id.
     */
    public function run(): void
    {
        $roles        = Role::pluck('id', 'code');
        $departments  = Department::pluck('id', 'name');
        $designations = Designation::pluck('id', 'name');

        $employees = [
            // name                       email                         employee_id  contact         role          department                 designation
            ['Uzzal Kar',                'uzzal.kar@mgi.org',          '120292',    '01896014581', 'super_admin', 'Information Technology', 'Assistant Manager'],
            ['Mosiur Rahman',            'mosiur_it@mgi.org',          '001203',    '01714166870', 'manager',     'Information Technology', 'Assistant General Manager'],
            ['Sharifur Rahman',          'sharifur.rahman@mgi.org',    '122287',    '01321150180', 'employee',    'Information Technology', 'Deputy Manager'],
            ['Md. Zubair Bin Tareque',   'zubair.tareque@mgi.org',     '097063',    '01894888301', 'employee',    'Information Technology', 'Deputy Manager'],
            ['Sheikh Asif Iqbal',        'asif.iqbal@mgi.org',         '118210',    '01894921971', 'employee',    'Information Technology', 'Senior Executive'],
            ['Ishtiaque Rahman',         'ishtiaque.rahman@mgi.org',   '121442',    '01321150121', 'employee',    'Information Technology', 'Assistant Manager'],
            ['Sina Ibn Amin',            'sina.amin@mgi.org',          '161393',    '01324415905', 'employee',    'Information Technology', 'Senior Executive'],
        ];

        foreach ($employees as [$name, $email, $empId, $contact, $roleCode, $deptName, $desigName]) {
            $roleId = $roles[$roleCode] ?? null;

            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name'           => $name,
                    'employee_id'    => $empId,
                    'office_contact' => $contact,
                    'password'       => Hash::make($empId),
                    'status'         => 1,
                    'role_id'        => $roleId,
                    'department_id'  => $departments[$deptName] ?? null,
                    'designation_id' => $designations[$desigName] ?? null,
                ]
            );

            if ($roleId) {
                $user->roles()->sync([$roleId]);
            }
            $user->flushPermissionCache();
        }
    }
}
