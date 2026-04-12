import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const { resident_id, metric, value, unit, device_id, source } =
      await request.json();

    // 1. Save reading
    const [reading] = await sql`
      INSERT INTO readings (resident_id, metric, value, unit, device_id, source)
      VALUES (${resident_id}, ${metric}, ${value}, ${unit}, ${device_id}, ${source || "auto"})
      RETURNING *
    `;

    // 2. Fetch Care Plan thresholds
    const [carePlan] =
      await sql`SELECT * FROM care_plans WHERE resident_id = ${resident_id}`;

    let severity = null;
    let alertMessage = "";

    // 3. Simple threshold logic (can be expanded)
    if (carePlan) {
      if (metric === "glucose") {
        if (value < carePlan.glucose_low) {
          severity = value < carePlan.glucose_low - 20 ? "critical" : "warning";
          alertMessage = `${severity.toUpperCase()}: Low Glucose detected (${value} ${unit})`;
        } else if (value > carePlan.glucose_high) {
          severity =
            value > carePlan.glucose_high + 100 ? "critical" : "warning";
          alertMessage = `${severity.toUpperCase()}: High Glucose detected (${value} ${unit})`;
        }
      }
      // Add other metrics (HR, BP, etc.) here...
    }

    // 4. Create Alert if needed
    if (severity) {
      await sql`
        INSERT INTO alerts (resident_id, severity, message, metric, value)
        VALUES (${resident_id}, ${severity}, ${alertMessage}, ${metric}, ${value})
      `;

      // Update resident overall status
      await sql`
        UPDATE residents 
        SET status = ${severity} 
        WHERE id = ${resident_id} 
        AND (status != 'critical' OR ${severity} = 'critical') -- don't downgrade from critical to warning automatically
      `;
    } else {
      // If reading is normal, maybe reset status if no other open alerts exist
      const openAlerts =
        await sql`SELECT count(*) FROM alerts WHERE resident_id = ${resident_id} AND status = 'open'`;
      if (parseInt(openAlerts[0].count) === 0) {
        await sql`UPDATE residents SET status = 'stable' WHERE id = ${resident_id}`;
      }
    }

    return Response.json(reading);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to record reading" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const residentId = searchParams.get("residentId");
    const metric = searchParams.get("metric");
    const limit = searchParams.get("limit") || 50;

    let query = `SELECT * FROM readings WHERE 1=1`;
    const params = [];

    if (residentId) {
      query += ` AND resident_id = $${params.length + 1}`;
      params.push(residentId);
    }
    if (metric) {
      query += ` AND metric = $${params.length + 1}`;
      params.push(metric);
    }

    query += ` ORDER BY recorded_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const readings = await sql(query, params);
    return Response.json(readings);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch readings" },
      { status: 500 },
    );
  }
}
