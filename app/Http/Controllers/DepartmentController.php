<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function index(): Response
    {
        $this->authorize('permission', 'departments.view');

        $departments = Department::withCount(['designations', 'users'])->orderBy('name')->get()
            ->map(fn (Department $d) => [
                'id'                 => $d->id,
                'name'               => $d->name,
                'status'             => $d->status,
                'designations_count' => $d->designations_count,
                'users_count'        => $d->users_count,
            ]);

        return Inertia::render('Settings/Departments/Index', ['departments' => $departments]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('permission', 'departments.create');
        $data = $request->validate([
            'name'   => ['required', 'string', 'max:255', 'unique:departments,name'],
            'status' => ['integer', 'in:0,1'],
        ]);
        Department::create($data);

        return back()->with('status', 'Department created.');
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        $this->authorize('permission', 'departments.update');
        $data = $request->validate([
            'name'   => ['required', 'string', 'max:255', Rule::unique('departments')->ignore($department->id)],
            'status' => ['integer', 'in:0,1'],
        ]);
        $department->update($data);

        return back()->with('status', 'Department updated.');
    }

    public function toggleStatus(Department $department): RedirectResponse
    {
        $this->authorize('permission', 'departments.update');
        $department->toggleStatus();

        return back();
    }

    public function destroy(Department $department): RedirectResponse
    {
        $this->authorize('permission', 'departments.delete');
        $department->delete();

        return back()->with('status', 'Department deleted.');
    }
}
