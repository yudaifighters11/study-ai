import { NextResponse } from "next/server";
import { getAllExams } from "@/lib/csv/examRepository";
import { toErrorResponse } from "@/lib/apiErrorHandler";

export async function GET() {
  try {
    const exams = await getAllExams();
    return NextResponse.json({ exams });
  } catch (error) {
    return toErrorResponse(error);
  }
}
