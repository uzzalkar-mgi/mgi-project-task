<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Designation;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('permission', 'users.view');

        $search = trim((string) $request->input('q', ''));

        $users = User::with(['roles:id,name,code', 'department:id,name', 'designation:id,name'])
            ->when($search, function ($q) use ($search) {
                $q->where(function ($w) use ($search) {
                    $w->where('name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%")
                        ->orWhere('employee_id', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $u) => [
                'uuid'        => $u->uuid,
                'name'        => $u->name,
                'email'       => $u->email,
                'employee_id' => $u->employee_id,
                'contact'     => $u->office_contact,
                'department'  => $u->department?->name,
                'designation' => $u->designation?->name,
                'status'      => $u->status,
                'roles'       => $u->roles->pluck('name'),
                'avatar_url'  => $u->avatar_url,
            ]);

        return Inertia::render('Users/Index', [
            'users'     => $users,
            'filters'   => ['q' => $search],
            'canManage' => $request->user()->hasPermission('users.create'),
        ]);
    }

    public function show(User $user): Response
    {
        $this->authorize('permission', 'users.view');

        $user->load([
            'roles:id,name', 'department:id,name', 'designation:id,name',
            'ledProjects:id,uuid,name,status,priority,end_date',
            'projects:id,uuid,name,status',
            'tasks' => fn ($q) => $q->with('project:id,name')->orderBy('due_date'),
        ]);

        return Inertia::render('Users/Show', [
            'user' => [
                'uuid'        => $user->uuid,
                'name'        => $user->name,
                'email'       => $user->email,
                'employee_id' => $user->employee_id,
                'contact'     => $user->office_contact,
                'department'  => $user->department?->name,
                'designation' => $user->designation?->name,
                'status'      => $user->status,
                'roles'       => $user->roles->pluck('name'),
                'avatar_url'  => $user->avatar_url,
            ],
            'ledProjects' => $user->ledProjects->map(fn ($p) => [
                'uuid' => $p->uuid, 'name' => $p->name, 'status' => $p->status, 'priority' => $p->priority,
            ]),
            'memberProjects' => $user->projects->map(fn ($p) => [
                'uuid' => $p->uuid, 'name' => $p->name, 'status' => $p->status,
            ]),
            'tasks' => $user->tasks->map(fn ($t) => [
                'uuid' => $t->uuid, 'title' => $t->title, 'project' => $t->project?->name,
                'status' => $t->status, 'priority' => $t->priority, 'due_date' => $t->due_date?->toDateString(),
            ]),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('permission', 'users.create');

        return Inertia::render('Users/Form', $this->formOptions() + ['user' => null, 'assigned' => []]);
    }

    public function edit(User $user): Response
    {
        $this->authorize('permission', 'users.update');

        return Inertia::render('Users/Form', $this->formOptions() + [
            'user' => [
                'uuid'           => $user->uuid,
                'name'           => $user->name,
                'email'          => $user->email,
                'employee_id'    => $user->employee_id,
                'office_contact' => $user->office_contact,
                'department_id'  => $user->department_id,
                'designation_id' => $user->designation_id,
                'status'         => $user->status,
            ],
            'assigned' => $user->roles()->pluck('roles.id'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('permission', 'users.create');

        $data = $this->validateUser($request);

        $user = User::create([
            'name'           => $data['name'],
            'email'          => $data['email'],
            'employee_id'    => $data['employee_id'] ?? null,
            'office_contact' => $data['office_contact'] ?? null,
            'department_id'  => $data['department_id'] ?? null,
            'designation_id' => $data['designation_id'] ?? null,
            'password'       => Hash::make($data['password']),
            'status'         => $data['status'] ?? 1,
            'role_id'        => $data['role_ids'][0] ?? null,
        ]);
        $user->roles()->sync($data['role_ids'] ?? []);

        return redirect()->route('users.index')->with('status', 'User created.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorize('permission', 'users.update');

        $data = $this->validateUser($request, $user);

        $user->fill([
            'name'           => $data['name'],
            'email'          => $data['email'],
            'employee_id'    => $data['employee_id'] ?? null,
            'office_contact' => $data['office_contact'] ?? null,
            'department_id'  => $data['department_id'] ?? null,
            'designation_id' => $data['designation_id'] ?? null,
            'status'         => $data['status'] ?? 1,
            'role_id'        => $data['role_ids'][0] ?? null,
        ]);
        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }
        $user->save();
        $user->roles()->sync($data['role_ids'] ?? []);
        $user->flushPermissionCache();

        return redirect()->route('users.index')->with('status', 'User updated.');
    }

    /** Inline active/inactive toggle. */
    public function toggleStatus(User $user): RedirectResponse
    {
        $this->authorize('permission', 'users.update');
        $user->toggleStatus();

        return back();
    }

    private function formOptions(): array
    {
        return [
            'roles'        => Role::active()->orderBy('id')->get(['id', 'name']),
            'departments'  => Department::active()->orderBy('name')->get(['id', 'name']),
            'designations' => Designation::active()->orderBy('name')->get(['id', 'name']),
        ];
    }

    private function validateUser(Request $request, ?User $user = null): array
    {
        return $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'email'          => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user?->id)],
            'employee_id'    => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user?->id)],
            'office_contact' => ['nullable', 'string', 'max:30', Rule::unique('users')->ignore($user?->id)],
            'department_id'  => ['nullable', 'exists:departments,id'],
            'designation_id' => ['nullable', 'exists:designations,id'],
            'password'       => [$user ? 'nullable' : 'required', 'confirmed', Password::defaults()],
            'status'         => ['integer', 'in:0,1'],
            'role_ids'       => ['array', 'min:1'],
            'role_ids.*'     => ['exists:roles,id'],
        ]);
    }
}
