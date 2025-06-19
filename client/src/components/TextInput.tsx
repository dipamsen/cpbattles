export default function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={[
        "border border-gray-300 rounded px-4 py-2 bg-white disabled:opacity-50",
        props.className || "",
      ].join(" ")}
    />
  );
}
