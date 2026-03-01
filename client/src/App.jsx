import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1 class="text-3xl text-red-500 font-bold underline border-2 m-5">
        Hello world!
      </h1>
    </>
  );
}

export default App;
