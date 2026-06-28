<?php

namespace App\Http\Controllers;

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

        $designations = Designation::withCount('users')->orderBy('name')->get()
            ->map(fn (Designation $d) => [
                'id'          => $d->id,
                'name'        => $d->name,
                'status'      => $d->status,
                'users_count' => $d->users_count,
            ]);

        return Inertia::render('Settings/Designations/Index', [
            'designations' => $designations,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('permission', 'designations.create');
        $data = $request->validate([
            'name'          => ['required', 'string', 'max:255', 'unique:designations,name'],
            'status'        => ['integer', 'in:0,1'],
        ]);
        Designation::create($data);

        return back()->with('status', 'Designation created.');
    }

    public function update(Request $request, Designation $designation): RedirectResponse
    {
        $this->authorize('permission', 'designations.update');
        $data = $request->validate([
            'name'   => ['required', 'string', 'max:255', Rule::unique('designations')->ignore($designation->id)],
            'status' => ['integer', 'in:0,1'],
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
