import { useNavigate } from "react-router";
import { BASE_API_URL, useAuth } from "../hooks/useAuth";
import Button from "../components/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import TextInput from "../components/TextInput";

export default function CreateBattle() {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (details: {
      name: string;
      startTime: number;
      duration: number;
      minRating: number;
      maxRating: number;
      problemCount: number;
    }) => {
      if (!auth.authed) throw new Error("Unauthorized");

      const response = await auth.fetch(BASE_API_URL + "/api/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(details),
      });

      if (!response.ok) {
        throw new Error(
          (await response.json()).error || "Failed to create battle"
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["battles"] });
      navigate("/");
    },
    onError: (error) => {
      console.error("Error creating battle:", error);
    },
  });

  if (auth.loading) {
    return (
      <div className="flex flex-col items-center h-full flex-1 max-w-7xl w-[90%] mx-auto py-8 gap-4">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  if (!auth.authed) {
    navigate("/");
    return null;
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const details = {
      name: formData.get("title") as string,
      startTime: new Date(formData.get("startTime") as string).getTime(),
      duration: parseInt(formData.get("duration") as string, 10),
      minRating: parseInt(formData.get("minRating") as string, 10),
      maxRating: parseInt(formData.get("maxRating") as string, 10),
      problemCount: parseInt(formData.get("problemCount") as string, 10),
    };

    mutation.mutate(details);
  };
  const status = mutation.status;
  const error = mutation.error instanceof Error ? mutation.error.message : null;
  const isDisabled = status === "pending" || status === "success";

  return (
    <>
      <div className="flex flex-col items-center h-full flex-1 max-w-7xl w-[90%] mx-auto py-8 gap-4">
        <h1 className="text-2xl font-bold mb-4">Create a Battle</h1>

        <form className="w-full max-w-lg" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="title">
              Battle Title
            </label>
            <TextInput
              className="w-full"
              type="text"
              name="title"
              id="title"
              placeholder="Enter battle title"
            />
          </div>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <label className="block text-gray-700 mb-2" htmlFor="startTime">
                Start Time
              </label>
              <TextInput
                className="w-full"
                type="datetime-local"
                name="startTime"
                id="startTime"
                defaultValue={new Intl.DateTimeFormat('sv-SE', {
                  hour12: false,
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(new Date().getTime() + 2 * 60 * 1000))}
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-gray-700 mb-2" htmlFor="duration">
                Duration (minutes)
              </label>
              <TextInput
                className="w-full"
                type="number"
                name="duration"
                id="duration"
                placeholder="Enter duration in minutes"
              />
            </div>
          </div>
          <div className="mb-4 flex items-center gap-4">
            <div className="w-full">
              <label className="block text-gray-700 mb-2" htmlFor="minRating">
                Minimum Rating
              </label>
              <TextInput
                className="w-full"
                type="number"
                name="minRating"
                id="minRating"
                placeholder="Enter minimum rating"
              />
            </div>
            <div className="w-full">
              <label className="block text-gray-700 mb-2" htmlFor="maxRating">
                Maximum Rating
              </label>
              <TextInput
                className="w-full"
                type="number"
                name="maxRating"
                id="maxRating"
                placeholder="Enter maximum rating"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="problemCount">
              Number of Problems
            </label>
            <TextInput
              className="w-full"
              type="number"
              name="problemCount"
              id="problemCount"
              placeholder="Enter number of problems"
            />
          </div>
          <Button type="submit" disabled={isDisabled}>
            Create Battle
          </Button>
        </form>

        {status === "pending" && (
          <div className="mt-4 text-gray-600">Creating battle...</div>
        )}

        {status === "error" && (
          <div className="mt-4 text-red-600">
            Error: {error || "Failed to create battle"}
          </div>
        )}
        {status === "success" && (
          <div className="mt-4 text-green-600">
            Battle created successfully!
          </div>
        )}
      </div>
    </>
  );
}
