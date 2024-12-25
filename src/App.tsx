import { use, Suspense, useActionState, useOptimistic, useState, useTransition, createContext, useRef } from 'react'
import { useFormStatus } from 'react-dom';

async function updateName(name: string, timer: number): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      
      return resolve(true);
    }, timer);
  });
}
async function updateNameWithReject(name: string, timer: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const value = Date.now() % 2

      if (value === 0) {
        return reject();
      }
      return resolve(!value);
    }, timer);
  });
}

function UseTransactionComponent() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const onUpdateNameHandler = () => {
    startTransition(async () => {
      const isSuccess = await updateName(name, 3000);
  
      if (!isSuccess) {
        return setError("error");
      }

      setError("");
    })
  };

  return (
    <div>
      <input value={name} onChange={(event) => setName(event.target.value)} />
      <button onClick={onUpdateNameHandler} disabled={isPending} style={isPending? { background: 'blue' } : { }}>
        Update
      </button>

      <div>error: {error}</div>
    </div>
  );
}

function UseActionStateComponent() {
  const [error, setError] = useState("");
  const [state, action, isPending] = useActionState(
    async (previousState: FormData, newState: FormData) => {

      const previousName = previousState ? previousState?.get('name') : '';
      const newName = newState?.get('name') || '';
      if (previousName === newName) {
        setError("duplicate name");
        return previousState;
      }
      if (newName === "") {
        setError("name is required");
        return previousState;
      }
      const isSuccess = await updateName(newName as string, 3000);
      
      if (!isSuccess) {
        setError("error");
        return previousState;
      }

      setError("");
      return newState
    },
    ""
  );

  return (
    <div>
      <form action={action}>
        <input name='name' type="text" required />
        <Button/> 
        <div>state: {state}</div>
        <div>error: {error}</div>
      </form>
    </div>
  );
}

function UseOptimisticComponent() {
  const [originData, setOriginData] = useState('');
  const [name, setName] = useState(originData);
  const [optimisticName, setOptimisticName] = useOptimistic(originData);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const onUpdateNameHandler = () => {
    startTransition(async () => {
      setOptimisticName(name);
      
      try {
        await updateNameWithReject(name, 500);
  
        setError("");
        setOriginData(name);
      } catch {
        setError("error");
      }

    })
  };

  return (
    <div>
      <input value={name} onChange={(event) => setName(event.target.value)} />
      <button onClick={onUpdateNameHandler} disabled={isPending} style={isPending? { background: 'blue' } : { }}>
        Update
      </button>
      
      <div>optimisticName: {optimisticName}</div>
      <div>error: {error}</div>
    </div>
  );
}

function Button() {
  const {pending} = useFormStatus();

  return (
    <button type="submit" disabled={pending} style={pending? { background: 'blue' } : { }}>Update </button>
  )
}

function getName() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        name: "falsy",
      })
    }, 1_000)
  })
}


function UseWithPromise({ userNamePromise }: { userNamePromise: Promise<{success: boolean, name: string}> }) {
  const user = use(userNamePromise);
 
  return (
    <p>{(user as {success: boolean, name: string}).name}</p>
  )
}

const ThemeContext = createContext(null);

function UseWithContext({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }
  const theme = use(ThemeContext);

  return (
    <div>{theme}</div>
  )
}

function ReceiveRef({ ref }) {
  return <input ref={ref} />
}

function CleanUpRef() {
  const [show, setShow] = useState(true);

  return (
    (
      <div>
        {show && <div ref={(node) => console.log(node)} />}
        <button onClick={() => setShow(!show)}>Toggle</button>
      </div>
    )
  )
}

function App () {
  const TestRef = useRef(null)
  const userName = getName();

  return (
    <>
      <div>
        <h1>useTransition</h1>
        <UseTransactionComponent />
      </div>

      <div>
        <h1>useActionState</h1>
        <UseActionStateComponent />
      </div>
      
      <div>
        <h1>useOptimistic</h1>
        <UseOptimisticComponent />
      </div>
      
      <div>
        <h1>use with promise</h1>
        <Suspense fallback={<div>use with promise Loading...</div>}>
          <UseWithPromise userNamePromise={userName}/>
        </Suspense>
      </div>

      <div>
        <ThemeContext value="dark">
          <h1>use with context</h1>
          <UseWithContext show={true}/>
          <UseWithContext show={false}/>
        </ThemeContext>
      </div>
      <div>
        <ThemeContext.Provider value="dark">
          <h1>use with context</h1>
          <UseWithContext show={true}/>
          <UseWithContext show={false}/>
        </ThemeContext.Provider>
      </div>

      <div>
        <h1> useRef </h1>
        <ReceiveRef ref={TestRef} />
        <button onClick={() => TestRef?.current?.focus()}>Focus</button>
        <button onClick={() => console.log(TestRef)}>Log Ref</button>
      </div>

      <div>
        <h1>ref cleanup</h1>
        <CleanUpRef />
      </div>
    </>
  )
}
export default App
