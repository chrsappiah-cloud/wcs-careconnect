// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "open";
    const residentId = searchParams.get("residentId");

    let query = `
      SELECT a.*, r.name as resident_name, r.room as resident_room
      FROM alerts a
      JOIN residents r ON a.resident_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (status !== "all") {
      query += ` AND a.status = $${params.length + 1}`;
      params.push(status);
    }
    if (residentId) {
      query += ` AND a.resident_id = $${params.length + 1}`;
      params.push(residentId);
    }

    query += ` ORDER BY a.severity = 'critical' DESC, a.created_at DESC`;

    const alerts = await sql(query, params);
    return Response.json(alerts);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, status, acknowledged_by } = await request.json();

    const [alert] = await sql`
      UPDATE alerts 
      SET status = ${status}, 
          acknowledged_by = ${acknowledged_by},
          acknowledged_at = ${status === "acknowledged" ? new Date() : null}
      WHERE id = ${id}
      RETURNING *
    `;

    // Re-check resident status
    const openAlerts =
      await sql`SELECT count(*) FROM alerts WHERE resident_id = ${alert.resident_id} AND status = 'open'`;
    if (parseInt(openAlerts[0].count) === 0) {
      await sql`UPDATE residents SET status = 'stable' WHERE id = ${alert.resident_id}`;
    }

    return Response.json(alert);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to update alert" }, { status: 500 });
  }
}
