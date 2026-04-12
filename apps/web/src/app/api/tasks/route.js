import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const residentId = searchParams.get("residentId");
    const status = searchParams.get("status") || "pending";

    let query = `SELECT t.*, r.name as resident_name FROM tasks t JOIN residents r ON t.resident_id = r.id WHERE 1=1`;
    const params = [];

    if (residentId) {
      query += ` AND t.resident_id = $${params.length + 1}`;
      params.push(residentId);
    }
    if (status !== "all") {
      query += ` AND t.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY t.due_at ASC`;

    const tasks = await sql(query, params);
    return Response.json(tasks);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, status, completed_at } = await request.json();
    const [task] = await sql`
      UPDATE tasks 
      SET status = ${status}, 
          completed_at = ${status === "completed" ? completed_at || new Date() : null}
      WHERE id = ${id}
      RETURNING *
    `;
    return Response.json(task);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to update task" }, { status: 500 });
  }
}
