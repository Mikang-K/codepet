# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language & Style
- **Communication Language:** All responses and explanations must be in Korean. (모든 답변과 설명은 한국어로 작성할 것)
- **Code Comments:** Keep code comments in English for universality. (코멘트는 관례에 따라 영어로 유지)

# **[프로젝트 명세서] CodePet: Dev-Buddy**

## **1. 프로젝트 개요**

• **목적:** 개발자의 코딩 습관(시간, 양, 품질)을 데이터화하여 가상의 펫을 성장시키는 VS Code 확장 프로그램.

• **핵심 타겟:** 코딩 과정에서 성취감을 얻고 싶은 개발자, 데스크테리어와 디지털 가젯을 좋아하는 사용자.

• **주요 기술 스택:** TypeScript, VS Code Extension API, HTML/CSS/JS (Webview), Node.js, esbuild

---

## **2. 주요 기능 (Functional Requirements)**

### **A. 펫 시각화 (Webview UI)**

• **이미지 렌더링:** 사용자가 준비한 외부 GIF/PNG 이미지를 VS Code 사이드바 혹은 하단 패널에 표시.

• **상태별 애니메이션:** * `Idle`: 코딩 중이 아닐 때 (숨쉬기, 잠자기)

    ◦ `Coding`: 타이핑 중일 때 (열심히 작업하는 모션)

    ◦ `Level-Up`: 특정 경험치 도달 시 (진화 혹은 축하 모션)

• **상태창:** 현재 레벨, 경험치 바(XP Bar), 현재 스탯 표시.


### **B. 데이터 트래킹 및 경험치(XP) 로직**

1. **작성 시간 (Active Time):** VS Code 창이 활성화되어 있고 편집이 일어나는 시간을 측정. (5분당 10 XP)

2. **코딩 양 (LOC/Char):** 입력된 글자 수 또는 라인 수를 기반으로 산출. (100자당 5 XP)

3. **커밋 활동 (Git Integration):** `git commit` 발생 시 보너스 경험치 부여. (커밋 1회당 50 XP)

4. **구조 정교함 (Optional):** 파일의 복잡도나 함수 분리 등을 간단히 체크하여 '지능' 스탯 부여.


### **C. 데이터 저장 및 관리**

• 사용자의 펫 이름, 레벨, 누적 경험치 데이터를 `globalState`에 영구 저장.

• 사용자가 자신의 외부 이미지 경로를 설정에서 변경할 수 있는 기능.

---

### **3. 사용자 시나리오**

1. 사용자가 VS Code 마켓플레이스에서 확장 프로그램을 설치한다.

2. 사이드바 아이콘을 클릭하여 CodePet 패널을 연다.

3. 사용자가 코딩을 시작하면 펫이 'Coding' 애니메이션으로 바뀌며 실시간으로 경험치가 쌓인다.

4. 경험치가 가득 차면 펫이 진화하며 새로운 GIF 이미지로 교체된다.