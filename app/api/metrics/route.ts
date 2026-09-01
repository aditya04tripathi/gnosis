import { NextResponse } from "next/server";
import { register as metricsRegister } from "@/lib/http-metrics";

export async function GET() {
	const metrics = await metricsRegister.metrics();
	return new NextResponse(metrics, {
		headers: { "Content-Type": metricsRegister.contentType },
	});
}
