# React 19 새로운 API 데모

이 프로젝트는 React 19의 새로운 훅들을 실제로 사용해보고 이해할 수 있는 데모 애플리케이션입니다.

## 주요 기능

### 1. useTransition

- 상태 업데이트를 트랜지션으로 표시하여 UI의 응답성을 유지
- 사용자 경험을 해치지 않으면서 무거운 업데이트를 처리

### 2. useActionState

- 폼의 상태와 액션을 관리하는 새로운 훅
- 로딩 상태와 낙관적 업데이트를 기본으로 제공
- 폼 제출과 관련된 상태 관리를 단순화

### 3. useOptimistic

- 서버 응답을 기다리지 않고 즉시 UI를 업데이트
- 사용자에게 즉각적인 피드백 제공
- 실패 시 자동으로 이전 상태로 롤백

### 4. use

- Promise를 직접 컴포넌트에서 사용 가능
- Context 값을 더 간단하게 사용
- 기존 useContext를 대체할 수 있는 새로운 방법

### 5. useRef

- DOM 요소에 직접 접근
- 렌더링 사이에 값을 유지
- ref cleanup 데모 포함

### 6. createContext

- 컴포넌트 트리에서 데이터를 공유
- Context API를 사용하여 상태 관리

## 기술 스택

- React 19
- TypeScript
- Tailwind CSS
- Vite

## 시작하기

```bash
# 저장소 클론
git clone [repository-url]

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 학습 포인트

1. React 19의 새로운 훅들의 실제 사용 사례
2. 비동기 작업과 상태 관리
