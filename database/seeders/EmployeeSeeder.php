<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EmployeeSeeder extends Seeder
{
    /**
     * Seeds a realistic set of MGI employees and assigns each a role.
     * Permissions flow from the role (see RolePermissionSeeder) — super-admin
     * holds all via Gate::before.
     */
    public function run(): void
    {
        $roles = Role::pluck('id', 'code'); // ['admin'=>1, 'manager'=>2, 'member'=>3]

        $employees = [
            // name                 email                       employee_id  role      contact
            ['Rahim Uddin',        'rahim@mgi.org',            'MGI-1001',  'manager', '01711000001'],
            ['Karim Hossain',      'karim@mgi.org',            'MGI-1002',  'manager', '01711000002'],
            ['Nadia Islam',        'nadia@mgi.org',            'MGI-1003',  'member',  '01711000003'],
            ['Sajid Rahman',       'sajid@mgi.org',            'MGI-1004',  'member',  '01711000004'],
            ['Tania Akter',        'tania@mgi.org',            'MGI-1005',  'member',  '01711000005'],
            ['Imran Chowdhury',    'imran@mgi.org',            'MGI-1006',  'member',  '01711000006'],
            ['Farhana Yasmin',     'farhana@mgi.org',          'MGI-1007',  'member',  '01711000007'],
            ['Tanvir Ahmed',       'tanvir@mgi.org',           'MGI-1008',  'member',  '01711000008'],
            ['Sabbir Khan',        'sabbir@mgi.org',           'MGI-1009',  'member',  '01711000009'],
            ['Mizanur Rahman',     'mizan@mgi.org',            'MGI-1010',  'admin',   '01711000010'],
        ];

        foreach ($employees as [$name, $email, $empId, $roleCode, $contact]) {
            $roleId = $roles[$roleCode];

            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name'           => $name,
                    'employee_id'    => $empId,
                    'office_contact' => $contact,
                    'password'       => Hash::make('password'),
                    'status'         => 1,
                    'role_id'        => $roleId,
                ]
            );

            // Role pivot (source of truth for permissions).
            $user->roles()->syncWithoutDetaching([$roleId]);
            $user->flushPermissionCache();
        }
    }
}
