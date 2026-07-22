<table border="1">
    <thead>
        <tr>
            <th colspan="7" style="font-size:16px;font-weight:bold;background:#1d4ed8;color:#fff;">MGI — Task Report</th>
        </tr>
        <tr>
            <td colspan="7">Employee: {{ $employee }} &nbsp;|&nbsp; Status: {{ $status }} &nbsp;|&nbsp; Generated: {{ now()->format('d M Y H:i') }} &nbsp;|&nbsp; Total: {{ count($rows) }}</td>
        </tr>
        <tr style="background:#e2e8f0;font-weight:bold;">
            <th>Task No</th>
            <th>Title</th>
            <th>Project</th>
            <th>Assignees</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Due Date</th>
        </tr>
    </thead>
    <tbody>
        @forelse ($rows as $r)
            <tr>
                <td>{{ $r['task_no'] }}</td>
                <td>{{ $r['title'] }}</td>
                <td>{{ $r['project'] }}</td>
                <td>{{ $r['assignees'] }}</td>
                <td>{{ ucfirst($r['priority']) }}</td>
                <td>{{ $r['status_label'] }}</td>
                <td>{{ $r['due_date'] }}</td>
            </tr>
        @empty
            <tr><td colspan="7">No tasks found for the selected filters.</td></tr>
        @endforelse
    </tbody>
</table>
