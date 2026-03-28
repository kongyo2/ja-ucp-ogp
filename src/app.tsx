import { useReducer, useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { TextInput, Spinner, StatusMessage, Badge, Alert, UnorderedList } from "@inkjs/ui";
import { generateOGP } from "./generator.js";
import { sanitize, WIKI_BASE_URL } from "./utils.js";

type Step = "title" | "description" | "image" | "output" | "generating" | "success" | "error";

interface AppState {
  step: Step;
  title: string;
  description: string;
  image: string;
  output: string;
  resultPath: string;
  errorMsg: string;
}

type Action =
  | { type: "SET_TITLE"; value: string }
  | { type: "SET_DESCRIPTION"; value: string }
  | { type: "SET_IMAGE"; value: string }
  | { type: "SET_OUTPUT"; value: string }
  | { type: "GENERATE_SUCCESS"; path: string }
  | { type: "GENERATE_ERROR"; message: string };

const initialState: AppState = {
  step: "title",
  title: "",
  description: "",
  image: "",
  output: "",
  resultPath: "",
  errorMsg: "",
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_TITLE":
      return { ...state, title: action.value, step: "description" };
    case "SET_DESCRIPTION":
      return { ...state, description: action.value, step: "image" };
    case "SET_IMAGE":
      return { ...state, image: action.value, step: "output" };
    case "SET_OUTPUT":
      return { ...state, output: action.value, step: "generating" };
    case "GENERATE_SUCCESS":
      return { ...state, resultPath: action.path, step: "success" };
    case "GENERATE_ERROR":
      return { ...state, errorMsg: action.message, step: "error" };
  }
}

interface AppProps {
  fontPath?: string;
}

const stepNumber = (step: Step): number => {
  const map: Record<Step, number> = {
    title: 1,
    description: 2,
    image: 3,
    output: 4,
    generating: 5,
    success: 6,
    error: 6,
  };
  return map[step];
};

export default function App({ fontPath }: AppProps) {
  const { exit } = useApp();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { step, title, description, image, output, resultPath, errorMsg } = state;

  const defaultOutput = title ? `output/${sanitize(title)}.png` : "output/ogp.png";

  useEffect(() => {
    if (step !== "generating") return;

    const outputPath = output || defaultOutput;
    generateOGP({
      title,
      description,
      imagePath: image || undefined,
      outputPath,
      fontPath,
    })
      .then((path) => dispatch({ type: "GENERATE_SUCCESS", path }))
      .catch((err) => dispatch({ type: "GENERATE_ERROR", message: (err as Error).message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step !== "success" && step !== "error") return;

    const timer = setTimeout(() => {
      exit();
      if (step === "error") process.exit(1);
    }, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={1} marginLeft={1}>
        <Badge color="blue">OGP Generator</Badge>
        <Text dimColor>v1.0.0</Text>
      </Box>

      {step === "title" && (
        <>
          <Box marginLeft={1}>
            <Text color="cyan">▸ </Text>
            <Text bold>Step {stepNumber(step)}/4 — 記事タイトルを入力してください</Text>
          </Box>
          <Box marginLeft={2}>
            <TextInput
              placeholder="タイトル..."
              onSubmit={(value) => {
                if (value.trim()) {
                  dispatch({ type: "SET_TITLE", value: value.trim() });
                }
              }}
            />
          </Box>
        </>
      )}

      {step === "description" && (
        <>
          <Box marginLeft={1}>
            <StatusMessage variant="success">{title}</StatusMessage>
          </Box>
          <Box marginLeft={3}>
            <Text dimColor>
              {"→ "}
              {WIKI_BASE_URL}
              {title}
            </Text>
          </Box>
          <Box marginLeft={1}>
            <Text color="cyan">▸ </Text>
            <Text bold>Step {stepNumber(step)}/4 — 概要文を入力してください</Text>
          </Box>
          <Box marginLeft={2}>
            <TextInput
              placeholder="概要文..."
              onSubmit={(value) => {
                if (value.trim()) {
                  dispatch({ type: "SET_DESCRIPTION", value: value.trim() });
                }
              }}
            />
          </Box>
        </>
      )}

      {step === "image" && (
        <>
          <UnorderedList>
            <UnorderedList.Item>
              <Text color="green">{title}</Text>
            </UnorderedList.Item>
            <UnorderedList.Item>
              <Text color="green">{description}</Text>
            </UnorderedList.Item>
          </UnorderedList>
          <Box marginLeft={1}>
            <Text color="cyan">▸ </Text>
            <Text bold>Step {stepNumber(step)}/4 — 画像パス（省略可）</Text>
          </Box>
          <Box marginLeft={2}>
            <TextInput
              placeholder="Enter でスキップ"
              onSubmit={(value) => {
                dispatch({ type: "SET_IMAGE", value: value.trim() });
              }}
            />
          </Box>
        </>
      )}

      {step === "output" && (
        <>
          <UnorderedList>
            <UnorderedList.Item>
              <Text color="green">{title}</Text>
            </UnorderedList.Item>
            <UnorderedList.Item>
              <Text color="green">{description}</Text>
            </UnorderedList.Item>
            {image && (
              <UnorderedList.Item>
                <Text color="green">{image}</Text>
              </UnorderedList.Item>
            )}
          </UnorderedList>
          <Box marginLeft={1}>
            <Text color="cyan">▸ </Text>
            <Text bold>Step {stepNumber(step)}/4 — 出力先パス</Text>
          </Box>
          <Box marginLeft={2}>
            <Text dimColor>デフォルト: {defaultOutput}</Text>
          </Box>
          <Box marginLeft={2}>
            <TextInput
              placeholder={defaultOutput}
              onSubmit={(value) => {
                dispatch({
                  type: "SET_OUTPUT",
                  value: value.trim() || defaultOutput,
                });
              }}
            />
          </Box>
        </>
      )}

      {step === "generating" && (
        <Box marginLeft={1} flexDirection="column" gap={1}>
          <Spinner label="OGP画像を生成中..." />
        </Box>
      )}

      {step === "success" && (
        <Box marginLeft={1}>
          <Alert variant="success">生成完了: {resultPath}</Alert>
        </Box>
      )}

      {step === "error" && (
        <Box marginLeft={1}>
          <Alert variant="error">エラー: {errorMsg}</Alert>
        </Box>
      )}
    </Box>
  );
}
