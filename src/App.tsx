import { use, Suspense, useActionState, useOptimistic, useState, useTransition, createContext, useRef, Component } from 'react'
import { useFormStatus } from 'react-dom';

// Types for API responses
interface Product {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  description: string;
}

interface Cart {
  id: number;
  total: number;
  totalProducts: number;
  userId: number;
  products: Array<{
    id: number;
    title: string;
    price: number;
    quantity: number;
  }>;
}

// API functions with error handling
async function getProducts(): Promise<{ products: Product[] }> {
  const response = await fetch('https://dummyjson.com/products?limit=3');
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

async function getCart(id: number): Promise<Cart> {
  const response = await fetch(`https://dummyjson.com/carts/${id}`);
  if (!response.ok) throw new Error('Failed to fetch cart');
  return response.json();
}

// Helper functions for examples
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

// Error Boundary Component
class ErrorBoundary extends Component<{
  children: React.ReactNode;
  fallback: React.ComponentType<{ error: Error }>;
}> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <this.props.fallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

function LoadingFallback() {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-3">
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="text-red-500">
        <p className="font-medium">에러가 발생했습니다:</p>
        <p>{error.message}</p>
      </div>
    </div>
  );
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

const ThemeContext = createContext<{ 
  mode: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  toggleMode: () => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
} | null>(null);

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('large');

  const toggleMode = () => setMode(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ 
      mode, 
      fontSize, 
      toggleMode,
      setFontSize
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

function UseWithContext({ show }: { show: boolean }) {
  if (!show) return null;
  const theme = use(ThemeContext);
  
  return (
    <div className={`
      p-4 rounded-lg
      ${theme?.mode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
      ${theme?.fontSize === 'large' ? 'text-lg' : theme?.fontSize === 'small' ? 'text-sm' : 'text-base'}
    `}>
      <p className="mb-2">현재 테마 설정:</p>
      <ul className="space-y-1 mb-4">
        <li>• 모드: {theme?.mode}</li>
        <li>• 글자 크기: {theme?.fontSize}</li>
      </ul>
      <div className="space-y-2">
        <Button onClick={theme?.toggleMode} fullWidth>
          테마 변경
        </Button>
        <div className="flex gap-2">
          <Button 
            onClick={() => theme?.setFontSize('small')}
            className={theme?.fontSize === 'small' ? 'bg-green-600' : ''}
          >
            작게
          </Button>
          <Button 
            onClick={() => theme?.setFontSize('medium')}
            className={theme?.fontSize === 'medium' ? 'bg-green-600' : ''}
          >
            보통
          </Button>
          <Button 
            onClick={() => theme?.setFontSize('large')}
            className={theme?.fontSize === 'large' ? 'bg-green-600' : ''}
          >
            크게
          </Button>
        </div>
      </div>
    </div>
  );
}

function UseWithPromise() {
  const [productsPromise, setProductsPromise] = useState<Promise<{ products: Product[] }> | null>(null);
  
  const fetchProducts = () => {
    setProductsPromise(getProducts());
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">상품 목록</h3>
        <Button onClick={fetchProducts}>상품 불러오기</Button>
      </div>
      {productsPromise && (
        <Suspense fallback={<LoadingFallback />}>
          <ErrorBoundary fallback={ErrorFallback}>
            <ProductList productsPromise={productsPromise} />
          </ErrorBoundary>
        </Suspense>
      )}
    </div>
  );
}

function ProductList({ productsPromise }: { productsPromise: Promise<{ products: Product[] }> }) {
  const { products } = use(productsPromise);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map(product => (
        <div key={product.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
          <img 
            src={product.thumbnail} 
            alt={product.title}
            className="w-full h-32 object-cover rounded-lg mb-2"
          />
          <h4 className="font-medium truncate" title={product.title}>{product.title}</h4>
          <p className="text-sm text-gray-600 h-12 overflow-hidden">{product.description}</p>
          <p className="text-blue-600 font-semibold mt-2">${product.price}</p>
        </div>
      ))}
    </div>
  );
}

function UseWithCart() {
  const [cartPromise, setCartPromise] = useState<Promise<Cart> | null>(null);
  
  const fetchCart = () => {
    setCartPromise(getCart(1));
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">장바구니 정보</h3>
        <Button onClick={fetchCart}>장바구니 불러오기</Button>
      </div>
      {cartPromise && (
        <Suspense fallback={<LoadingFallback />}>
          <ErrorBoundary fallback={ErrorFallback}>
            <CartDetails cartPromise={cartPromise} />
          </ErrorBoundary>
        </Suspense>
      )}
    </div>
  );
}

function CartDetails({ cartPromise }: { cartPromise: Promise<Cart> }) {
  const cart = use(cartPromise);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
        <p>총 상품 수</p>
        <span className="font-medium">{cart.totalProducts}개</span>
      </div>
      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
        <p>총 금액</p>
        <span className="font-medium text-blue-600">${cart.total}</span>
      </div>
      <div className="mt-4">
        <h4 className="font-medium mb-2">장바구니 상품</h4>
        <div className="space-y-2">
          {cart.products.map(product => (
            <div key={product.id} className="flex justify-between items-center p-2 border-b">
              <div>
                <p className="font-medium">{product.title}</p>
                <p className="text-sm text-gray-600">${product.price} x {product.quantity}</p>
              </div>
              <p className="font-medium">${product.price * product.quantity}</p>
            </div>
          ))}
        </div>
      </div>
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

function App() {
  const TestRef = useRef<HTMLInputElement | null>(null)

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
            <div className="space-y-4">
              <UseWithPromise />
              <UseWithCart />
            </div>
          }
        />

        <ExampleSection 
          title="Context와 함께 사용하는 use"
          description="use 훅은 Context 값을 직접 사용할 수 있게 해주어, useContext를 대체할 수 있는 더 간단한 방법을 제공합니다."
          component={
            <ThemeProvider>
              <div className="space-y-4">
                <UseWithContext show={true} />
                <UseWithContext show={false} />
              </div>
            </ThemeProvider>
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

export default App;
