<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Designation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DesignationController extends Controller
{
    public function index(): Response
    {
        $this->authorize('permission', 'designations.view');

        $designations = Designation::with('department:id,name')->withCount('users')->orderBy('name')->get()
            ->map(fn (Designation $d) => [
                'id'            => $d->id,
                'name'          => $d->name,
                'department'    => $d->department?->name,
                'department_id' => $d->department_id,
                'status'        => $d->status,
                'users_count'   => $d->users_count,
            ]);

        return Inertia::render('Settings/Designations/Index', [
            'designations' => $designations,
            'departments'  => Department::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('permission', 'designations.create');
        $data = $request->validate([
            'name'          => ['required', 'string', 'max:255', 'unique:designations,name'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'status'        => ['integer', 'in:0,1'],
        ]);
        Designation::create($data);

        return back()->with('status', 'Designation created.');
    }

    public function update(Request $request, Designation $designation): RedirectResponse
    {
        $this->authorize('permission', 'designations.update');
        $data = $request->validate([
            'name'          => ['required', 'string', 'max:255', Rule::unique('designations')->ignore($designation->id)],
            'department_id' => ['nullable', 'exists:departments,id'],
            'status'        => ['integer', 'in:0,1'],
        ]);
        $designation->update($data);

        return back()->with('status', 'Designation updated.');
    }

    public function toggleStatus(Designation $designation): RedirectResponse
    {
        $this->authorize('permission', 'designations.update');
        $designation->toggleStatus();

        return back();
    }

    public function destroy(Designation $designation): RedirectResponse
    {
        $this->authorize('permission', 'designations.delete');
        $designation->delete();

        return back()->with('status', 'Designation deleted.');
    }
}
