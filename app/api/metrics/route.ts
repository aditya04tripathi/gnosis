import { collectDefaultMetrics, register } from "prom-client";
import { NextResponse } from "next/server";
import { register as metricsRegister } from "@/lib/http-metrics";

let metricsInitialized = false;

function ensureMetrics() {
	if (!metricsInitialized) {
		collectDefaultMetrics({ register: metricsRegister });
		metricsInitialized = true;
	}
}

export async function GET() {
	ensureMetrics();
	const metrics = await metricsRegister.metrics();
	return new NextResponse(metrics, {
		headers: { "Content-Type": metricsRegister.contentType },
	});
}
