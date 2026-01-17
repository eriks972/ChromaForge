import { Form, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { prisma } from "~/lib/prisma.server";
import type { Palette, Color } from "../../prisma/generated";
import { Link } from "react-router";


type PaletteWithColors = Palette & { colors: Color[] };

export async function loader(_: LoaderFunctionArgs) {
  const palettes = await prisma.palette.findMany({
    include: { colors: true },
    orderBy: { createdAt: "desc" },
  });

  return { palettes: palettes as PaletteWithColors[] };
}

function isValidHex(hex: string) {
  return /^#([0-9a-fA-F]{6})$/.test(hex);
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const name = formData.get("name");
  const colorsRaw = formData.get("colors");

  if (typeof name !== "string" || name.trim().length === 0) {
    return { error: "Palette name is required" };
  }

  if (typeof colorsRaw !== "string") {
    return { error: "Colors are required" };
  }

  const colors = colorsRaw
    .split("\n")
    .map((c) => c.trim())
    .filter(Boolean);

  const invalid = colors.find((c) => !isValidHex(c));
  if (invalid) {
    return { error: `Invalid hex color: ${invalid}` };
  }

  await prisma.palette.create({
  data: {
    name,
    colors: {
      create: colors.map((hex, index) => ({
        hex,
        name: `Color ${index + 1}`,
      })),
    },
  },
});

  return { success: true };
}

export default function Index() {
  const { palettes } = useLoaderData<typeof loader>();

  return (
    <main style={{ padding: 32 }}>
      
      <h1 style={{ fontSize: 28, fontWeight: 600 }}>
        Chromforge Palettes
      </h1>

      <Link
      to="/explore"
      style={{
        color: "#4f8cff",
        textDecoration: "none",
        fontWeight: 500,
      }}
    >
      Explore
    </Link>


      {palettes.length === 0 && <p>No palettes yet.</p>}

      <Form method="post" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Create Palette</h2>

        <div style={{ marginBottom: 8 }}>
          <input
            type="text"
            name="name"
            placeholder="Palette name"
            required
            style={{
              padding: 8,
              width: 280,
              display: "block",
              marginBottom: 8,
            }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <textarea
            name="colors"
            placeholder="#1E40AF\n#14B8A6\n#64748B"
            rows={4}
            required
            style={{
              padding: 8,
              width: 280,
              resize: "vertical",
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: "8px 12px",
            background: "#2563eb",
            color: "white",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
          }}
        >
          Create Palette
        </button>
      </Form>


      {palettes.map((palette) => (
        <section key={palette.id} style={{ marginTop: 24 }}>
          <h2>
            <Link
              to={`/palette/${palette.id}`}
              style={{ color: "#60a5fa", textDecoration: "none" }}
            >
              {palette.name}
            </Link>
          </h2>

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            {palette.colors.map((color) => (
              <div key={color.id} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: color.hex,
                    borderRadius: 6,
                    border: "1px solid #ddd",
                  }}
                />
                <div style={{ fontSize: 12 }}>{color.hex}</div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
