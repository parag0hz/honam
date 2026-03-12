# Client (React App)

이 프로젝트는 [Create React App](https://github.com/facebook/create-react-app)으로 생성되었습니다.

## 환경 설정

> **⚠️ 보안 주의:** `.env` 파일은 절대 Git에 커밋하지 마세요. 이 파일은 `.gitignore`에 포함되어 있습니다.

1. `.env.example` 파일을 `.env`로 복사하세요:
   ```bash
   # macOS / Linux
   cp .env.example .env
   # Windows
   copy .env.example .env
   ```

2. `.env` 파일에서 다음 환경변수를 실제 값으로 설정하세요:
   - `REACT_APP_GOOGLE_MAPS_API_KEY`: 구글맵 API 키 (필수)
   - `REACT_APP_Maps_API_KEY`: 구글맵 API 키 (동일 키 사용)
   - `REACT_APP_KAKAO_JS_KEY`: 카카오 JavaScript 키 (필요 시)
   - `REACT_APP_KAKAO_REST_KEY`: 카카오 REST API 키 (필요 시)

### 구글맵 API 키 발급 방법

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "라이브러리"에서 다음 API 활성화:
   - Maps JavaScript API
   - Places API
4. "API 및 서비스" > "사용자 인증 정보"에서 API 키 생성
5. API 키를 복사하여 `.env` 파일에 설정
6. (권장) HTTP 리퍼러/IP 제한을 설정하여 키 도용을 방지하세요.

### 카카오 API 키 발급 방법

1. [Kakao Developers](https://developers.kakao.com/)에 접속
2. 내 애플리케이션 > 애플리케이션 추가
3. 앱 키 탭에서 **JavaScript 키**와 **REST API 키** 확인
4. 각 키를 `.env` 파일에 설정

## Available Scripts

프로젝트 디렉토리에서 다음 명령어들을 실행할 수 있습니다:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
