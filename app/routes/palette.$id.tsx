import { Form, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import type { Color, Palette } from "~/../prisma/generated";
import { Link } from "react-router";
import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { prisma } from "~/lib/prisma.server";



type PaletteWithColors = Palette & { colors: Color[] };

export async function action({ request, params }: ActionFunctionArgs) {
  // const { prisma } = await import("~/lib/prisma.server");

  const paletteId = params.id;
  if (!paletteId) {
    throw new Response("Missing palette id", { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get("_intent");

  // Rename
  if (intent === "rename") {
    const name = formData.get("name");
    if (typeof name !== "string" || !name.trim()) {
      throw new Response("Invalid name", { status: 400 });
    }

    await prisma.palette.update({
      where: { id: paletteId },
      data: { name },
    });

    return null;
  }

  // Delete
  if (intent === "delete") {
    await prisma.palette.delete({
      where: { id: paletteId },
    });

    return redirect("/");
  }

  // Toggle public / private
  if (intent === "toggle-visibility") {
    const isPublic = formData.get("isPublic") === "true";

    await prisma.palette.update({
      where: { id: paletteId },
      data: { isPublic },
    });

    return null;
  }

  if (intent === "duplicate") {
    const original = await prisma.palette.findUnique({
      where: { id: paletteId },
      include: { colors: true },
    });

    if (!original) {
      throw new Response("Palette not found", { status: 404 });
    }

    const copy = await prisma.palette.create({
      data: {
        name: `${original.name} (Copy)`,
        isPublic: true,
        colors: {
          create: original.colors.map((c: Color) => ({
             name: c.name,
            hex: c.hex,
          })),
        },
      },
    });

    return redirect(`/palette/${copy.id}`);
  }

  throw new Response("Unknown action", { status: 400 });
}


export async function loader({ params }: LoaderFunctionArgs) {
  const { prisma } = await import("~/lib/prisma.server");
  const id = params.id;

  if (!id) {
    throw new Response("Palette ID required", { status: 400 });
  }

  const palette: PaletteWithColors | null =
    await prisma.palette.findUnique({
      where: { id },
      include: { colors: true },
    });

  if (!palette || !palette.isPublic) {
    throw new Response("Not Found", { status: 404 });
  }

  return { palette };
}

function exportHex(colors: { hex: string }[]) {
  return colors.map(c => c.hex.toUpperCase()).join("\n");
}

function exportCSS(colors: { hex: string }[]) {
  return `:root {\n${colors
    .map((c, i) => `  --color-${i + 1}: ${c.hex};`)
    .join("\n")}\n}`;
}

function exportTailwind(colors: { hex: string }[]) {
  return `colors: {\n${colors
    .map((c, i) => `  color${i + 1}: "${c.hex}",`)
    .join("\n")}\n}`;
}

function exportJSON(name: string, colors: { hex: string }[]) {
  return JSON.stringify(
    {
      name,
      colors: colors.map(c => c.hex),
    },
    null,
    2
  );
}

function downloadPaletteAsPNG(palette: {
  name: string;
  colors: { hex: string }[];
}) {
  const width = 520;
  const padding = 32;
  const swatchSize = 90;
  const gap = 16;
  const titleHeight = 48;

  const height =
    padding * 2 +
    titleHeight +
    swatchSize +
    28;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 28px system-ui";
  ctx.fillText(palette.name, padding, padding + 28);

  // Swatches
  palette.colors.forEach((color, i) => {
    const x =
      padding + i * (swatchSize + gap);
    const y = padding + titleHeight;

    // Color box
    ctx.fillStyle = color.hex;
    ctx.fillRect(x, y, swatchSize, swatchSize);

    // Border
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.strokeRect(x, y, swatchSize, swatchSize);

    // HEX label
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px system-ui";
    ctx.fillText(
      color.hex.toUpperCase(),
      x,
      y + swatchSize + 18
    );
  });

  // Download
  const link = document.createElement("a");
  link.download = `${palette.name
    .toLowerCase()
    .replace(/\s+/g, "-")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}


async function copy(text: string) {
  await navigator.clipboard.writeText(text);
  alert("Copied to clipboard");
}


export default function PaletteDetail() {

  const { palette } = useLoaderData<typeof loader>();

  return (
    
    <main style={{ padding: 32 }}>
    <Link
        to="/"
        style={{
            display: "inline-block",
            marginTop: 24,
            color: "#4f8cff",
            textDecoration: "none",
            
        }}
        >
        ← Back to palettes
    </Link>

      <h1 style={{ fontSize: 28, fontWeight: 600 }}>
        {palette.name}
      </h1>

        <Form method="post" style={{ marginTop: 16 }}>
        <input
            type="hidden"
            name="_intent"
            value="rename"
        />

        <input
            name="name"
            defaultValue={palette.name}
            style={{
            padding: "8px 12px",
            fontSize: 16,
            width: 260,
            marginRight: 8,
            }}
        />

        <button
            type="submit"
            style={{
            padding: "8px 12px",
            background: "#4f8cff",
            color: "white",
            borderRadius: 6,
            border: "none",
            }}
        >
            Rename
        </button>
        </Form>


      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 24,
        }}
      >
        {palette.colors.map((color) => (
          <div key={color.id} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                backgroundColor: color.hex,
                border: "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer",

              }}
              onClick={() => copy(color.hex)}
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              {color.hex.toUpperCase()}
            </div>
          </div>
        ))}

        <Form method="post">
            <input type="hidden" name="intent" value="toggle-visibility" />
            <input
                type="hidden"
                name="isPublic"
                value={(!palette.isPublic).toString()}
            />

            <button
                type="submit"
                style={{
                background: palette.isPublic ? "#444" : "#16a34a",
                color: "white",
                padding: "8px 14px",
                borderRadius: 6,
                border: "none",
                }}
            >
                {palette.isPublic ? "Make Private" : "Make Public"}
            </button>
        </Form>

      </div>

      <Form
        method="post"
        onSubmit={(e) => {
            if (!confirm("Are you sure you want to delete this palette?")) {
            e.preventDefault();
            }
        }}
        >
        <input type="hidden" name="_intent" value="delete" />

        <button
            type="submit"
            style={{
            marginTop: 32,
            padding: "10px 16px",
            background: "#ff4f4f",
            color: "white",
            borderRadius: 6,
            border: "none",
            }}
        >
            Delete Palette
        </button>
        </Form>

      <br></br>

      <Form method="post">
        <input type="hidden" name="_intent" value="duplicate" />

        <button
          type="submit"
          style={{
            background: "#6366f1",
            color: "white",
            padding: "8px 14px",
            borderRadius: 6,
            border: "none",
            marginLeft: 8,
          }}
        >
          Duplicate
        </button>
      </Form>


    <section style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Export</h3>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button type="button" style={{
                padding: "8px 12px",
                background: "#2563eb",
                color: "white",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                }}
                onClick={() => copy(exportHex(palette.colors))}>
                Copy HEX
                </button>

                <button type="button" style={{
                padding: "8px 12px",
                background: "#2563eb",
                color: "white",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                }}
                onClick={() => copy(exportCSS(palette.colors))}>
                Copy CSS
                </button>

                <button type="button" style={{
                padding: "8px 12px",
                background: "#2563eb",
                color: "white",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                }}
                onClick={() => copy(exportTailwind(palette.colors))}>
                Copy Tailwind
                </button>

                <button type="button" style={{
                padding: "8px 12px",
                background: "#2563eb",
                color: "white",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                }}
                onClick={() =>
                    copy(exportJSON(palette.name, palette.colors))
                }
                >
                Copy JSON
                </button>
            </div>
    </section>

    
    <br></br>
    <button
        onClick={() => downloadPaletteAsPNG(palette)}
        style={{
            background: "#2563eb",
            color: "white",
            padding: "8px 14px",
            borderRadius: 6,
            border: "none",
        }}
        >
        Download PNG
    </button>


    </main>
  );
}
