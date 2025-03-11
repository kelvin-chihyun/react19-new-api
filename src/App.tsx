import { use, Suspense, useActionState, useOptimistic, useState, useTransition, createContext, useRef } from 'react'
import { useFormStatus } from 'react-dom';

function App() {
  const TestRef = useRef<HTMLInputElement | null>(null)
  const userName = getName();

  return (
    <div className="w-full min-h-screen bg-gray-100 px-4 py-8 flex justify-center items-center">
      <div className="max-w-3xl mx-auto space-y-8">
        <ExampleSection 
          title="useTransition"
          component={<UseTransactionComponent />}
        />

        <ExampleSection 
          title="useActionState"
          component={<UseActionStateComponent />}
        />
        
        <ExampleSection 
          title="useOptimistic"
          component={<UseOptimisticComponent />}
        />
        
        <ExampleSection 
          title="Promise와 함께 사용하는 use"
          description="use 훅을 사용하면 Promise를 직접 컴포넌트에서 사용할 수 있어, 데이터 페칭 패턴을 단순화할 수 있습니다."
          component={
            <Suspense fallback={<LoadingFallback />}>
              <UseWithPromise userNamePromise={userName}/>
            </Suspense>
          }
        />

        <ExampleSection 
          title="Context와 함께 사용하는 use"
          description="use 훅은 Context 값을 직접 사용할 수 있게 해주어, useContext를 대체할 수 있는 더 간단한 방법을 제공합니다."
          component={
            <ThemeContext.Provider value="dark">
              <div className="space-y-4">
                <UseWithContext show={true}/>
                <UseWithContext show={false}/>
              </div>
            </ThemeContext.Provider>
          }
        />

        <ExampleSection 
          title="useRef"
          description="useRef는 DOM 요소에 직접 접근하고 렌더링 사이에 값을 유지할 수 있게 해주는 훅입니다."
          component={
            <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
              <ReceiveRef ref={TestRef} />
              <Button 
                onClick={() => TestRef?.current?.focus()}
                fullWidth
              >
                입력창 포커스
              </Button>
            </div>
          }
        />

        <ExampleSection 
          title="Ref 정리(cleanup)"
          description="React가 컴포넌트가 언마운트될 때 ref를 어떻게 정리하는지 보여주는 예제입니다."
          component={
            <div className="p-6 bg-white rounded-lg shadow-md">
              <CleanUpRef />
            </div>
          }
        />
      </div>
    </div>
  )
}

interface ExampleSectionProps {
  title: string;
  description?: string;
  component: React.ReactNode;
}

function ExampleSection({ title, description, component }: ExampleSectionProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-gray-800">{title}</h1>
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      {component}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pending?: boolean;
  fullWidth?: boolean;
}

function Button({ pending, fullWidth, className, disabled, children, ...props }: ButtonProps) {
  const status = useFormStatus();
  const isPending = pending || status?.pending;

  return (
    <button 
      disabled={isPending || disabled}
      className={`
        px-4 py-2 rounded-lg font-medium
        transition-all duration-200
        ${isPending 
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed animate-pulse' 
          : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
        }
        ${fullWidth ? 'w-full' : ''}
        disabled:opacity-75 disabled:cursor-not-allowed
        ${className || ''}
      `}
      {...props}
    >
      {isPending ? '처리중...' : children}
    </button>
  );
}

function LoadingFallback() {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md animate-pulse">
      Loading...
    </div>
  );
}

async function updateName(name: string, timer: number): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), timer);
  });
}

async function updateNameWithReject(name: string, timer: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const value = Date.now() % 2;
      if (value === 0) return reject();
      return resolve(!value);
    }, timer);
  });
}

function getName(): Promise<{success: boolean, name: string}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        name: "falsy",
      });
    }, 1_000);
  });
}

function UseTransactionComponent() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const onUpdateNameHandler = () => {
    startTransition(async () => {
      const isSuccess = await updateName(name, 3000);
      setError(isSuccess ? "" : "error");
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <p className="text-gray-600 mb-4">
        useTransition을 사용하면 상태 업데이트를 트랜지션으로 표시하여, 
        업데이트 중에도 UI가 응답성을 유지할 수 있습니다.
      </p>
      <div className="flex gap-2">
        <input 
          className="flex-1"
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Enter name"
        />
        <Button onClick={onUpdateNameHandler} pending={isPending}>
          업데이트
        </Button>
      </div>
      {error && <div className="mt-2 text-red-500">Error: {error}</div>}
    </div>
  );
}

function UseActionStateComponent() {
  const [error, setError] = useState("");
  const [state, action, isPending] = useActionState<FormData, FormData>(
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
      setError(isSuccess ? "" : "error");
      return isSuccess ? newState : previousState;
    },
    new FormData()
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <p className="text-gray-600 mb-4">
        useActionState는 폼의 상태와 액션을 관리하며, 
        로딩 상태와 낙관적 업데이트를 기본으로 제공합니다.
      </p>
      <form action={action} className="space-y-4">
        <input 
          name='name' 
          type="text" 
          required 
          className="w-full"
          placeholder="Enter name"
        />
        <Button type="submit" fullWidth>업데이트</Button>
        {state?.get('name') && (
          <div className="text-gray-700">Current name: {state.get('name')?.toString()}</div>
        )}
        {error && <div className="text-red-500">Error: {error}</div>}
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
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <p className="text-gray-600 mb-4">
        useOptimistic을 사용하면 서버 응답을 기다리지 않고
        즉시 UI를 업데이트하여 더 나은 사용자 경험을 제공할 수 있습니다.
      </p>
      <div className="flex gap-2">
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="flex-1"
          placeholder="Enter name"
        />
        <Button onClick={onUpdateNameHandler} pending={isPending}>
          업데이트
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        <div className="text-gray-700">Optimistic value: {optimisticName}</div>
        {error && <div className="text-red-500">Error: {error}</div>}
      </div>
    </div>
  );
}

const ThemeContext = createContext<string | null>(null);

function UseWithPromise({ userNamePromise }: { userNamePromise: Promise<{success: boolean, name: string}> }) {
  const user = use(userNamePromise);
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-gray-600 mb-2">Resolved username:</p>
      <p className="text-lg font-medium">{user.name}</p>
    </div>
  );
}

function UseWithContext({ show }: { show: boolean }) {
  if (!show) return null;
  const theme = use(ThemeContext);
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-gray-600 mb-2">현재 테마:</p>
      <p className="text-lg font-medium">{theme}</p>
    </div>
  );
}

function ReceiveRef({ ref }: { ref: React.RefObject<HTMLInputElement | null> }) {
  return (
    <input 
      ref={ref}
      className="w-full" 
      placeholder="Click button to focus"
    />
  );
}

function CleanUpRef() {
  const [show, setShow] = useState(true);
  return (
    <div className="space-y-4">
      {show && <div ref={(node) => console.log(node)} className="p-4 bg-gray-50 rounded-lg" />}
      <Button onClick={() => setShow(!show)}>Toggle</Button>
    </div>
  );
}

export default App;
