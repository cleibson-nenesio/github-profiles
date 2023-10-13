interface UserData {
	avatar_url: string;
	bio: string;
	html_url: string;
	login: string;
	name: string;
}

interface UserRepo {
	full_name: string;
	name: string;
	language: string;
	forks_count: number;
	description: string | null;
	html_url: string;
	stargazers_count: number;
}

const userAvatar = document.querySelector('.user-container__avatar');
const userName = document.querySelector('.user-container__name');
const userDescription = document.querySelector('.user-container__description');
const tabs = document.querySelectorAll('.tabs__tab');
const tabsCount = document.querySelectorAll('.tabs__tab__count');
const reposList = document.getElementById('repos-list');
const searchForm = document.getElementById('search-form');

const baseUrl = 'https://api.github.com';
const params = new URLSearchParams(location.search);
const userNickname = params.get('user');
let userSearch = '';
let currentTab = params.get('tab') ?? 'repos';

// DOM

tabs.forEach((tab) => {
	const tabElement = tab as HTMLDivElement;

	if (tabElement.innerText.split(' ')[0].toLowerCase() === currentTab) {
		tab.classList.add('tabs__tab--selected');
	}

	tab.addEventListener('click', (e) => {
		const { target } = e;

		let tab = target as HTMLDivElement;
		const tabValue = tab.innerText.split(' ')[0].toLowerCase();

		if (tab.classList.contains('tabs__tab__count')) {
			tab = tab.parentElement as HTMLDivElement;
		}

		onSelectTab(tabValue);

		tabs.forEach((tab) => {
			tab.classList.remove('tabs__tab--selected');
		});

		tab.classList.add('tabs__tab--selected');
	});
});

searchForm?.addEventListener('submit', (e) => {
	e.preventDefault();

	if (!e.target) return;

	const formData = new FormData(searchForm as HTMLFormElement);
	userSearch = formData.get('search') as string;
	renderRepos();
});

// Functionalities

function onSelectTab(tab: string) {
	params.set('tab', tab);
	history.replaceState(null, '', `?${params.toString()}`);
	currentTab = tab;
	renderRepos();
}

// Github Integration

async function getUserData(
	user: string,
	infoType?: '/repos' | '/starred'
): Promise<void> {
	try {
		const response = await fetch(
			`${baseUrl}/users/${user}${infoType ?? ''}`
		);

		const data = await response.json();

		saveUserData(`@github:${infoType ?? '/user'}_data`, data);
	} catch (err) {
		console.error(err);
	}
}

function saveUserData(saveKey: string, userData: unknown) {
	localStorage.setItem(saveKey, JSON.stringify(userData));
}

async function setUserData(nickname: string) {
	await getUserData(nickname);
	await getUserData(nickname, '/repos');
	await getUserData(nickname, '/starred');

	const userStorage = localStorage.getItem('@github:/user_data');
	const reposStorage = localStorage.getItem('@github:/repos_data');
	const starredStorage = localStorage.getItem('@github:/starred_data');

	if (!userStorage) throw new Error('User não encontrado');
	const user: UserData = JSON.parse(userStorage);

	if (!reposStorage) throw new Error('User Repos não encontrados');
	const userRepos: UserRepo[] = JSON.parse(reposStorage);

	if (!starredStorage) throw new Error('User Starred não encontrado');
	const userStarred: UserRepo[] = JSON.parse(starredStorage);

	if (userAvatar) userAvatar?.setAttribute('src', user.avatar_url);
	if (userName) userName.innerHTML = `${user.name}`;
	if (userDescription) userDescription.innerHTML = `${user.bio}`;

	tabsCount[0].innerHTML = `${userRepos.length}`;
	tabsCount[1].innerHTML = `${userStarred.length}`;
}

function renderRepos() {
	const reposStorage = localStorage.getItem('@github:/repos_data');
	const starredStorage = localStorage.getItem('@github:/starred_data');

	if (!reposStorage) throw new Error('User Repos não encontrados');
	const userRepos: UserRepo[] = JSON.parse(reposStorage);

	if (!starredStorage) throw new Error('User Starred não encontrado');
	const userStarred: UserRepo[] = JSON.parse(starredStorage);

	const tabRepos: { [key: string]: UserRepo[] } = {
		repos: userRepos,
		starred: userStarred,
	};

	reposList!.innerHTML = ``;

	const filteredRepos = tabRepos[currentTab].filter((repo) =>
		repo.name.includes(userSearch)
	);

	filteredRepos.forEach((repo) => {
		reposList!.innerHTML += `
                <li class="list__item">
                    <p class="list__item__title">
						${
							currentTab === 'repos'
								? `
							<a href='${repo.html_url}' target="_blank">
								${repo.name}
							</a>
						`
								: `
							<a href='${repo.html_url}'>
								<span class="list__item__title--regular">
									${repo.full_name.split('/')[0]} 
									/ 
									</span>
								${repo.full_name.split('/')[1]}
							</a>
						`
						}
                    </p>
    
                    <p class="list__item__description">${
						repo?.description ?? ''
					}</p>
    
                    <div class="list__item__metadata-container">
						<p class="list__item__metadata">
							${
								currentTab === 'starred'
									? `
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
									<path fill="currentColor" d="m5.825 22l1.625-7.025L2 10.25l7.2-.625L12 3l2.8 6.625l7.2.625l-5.45 4.725L18.175 22L12 18.275L5.825 22Z"/>
								</svg>
									`
									: `
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
									<path fill="currentColor" d="m8 18l-6-6l6-6l1.425 1.425l-4.6 4.6L9.4 16.6L8 18Zm8 0l-1.425-1.425l4.6-4.6L14.6 7.4L16 6l6 6l-6 6Z"/>
								</svg>
								`
							}
							

							${
								currentTab === 'starred'
									? repo.stargazers_count.toLocaleString(
											'en-US'
									  )
									: repo.language
							}
						</p>
					
    
                        <p class="list__item__metadata">
                            <img src="./src/images/fork-icon.png" alt="Fork Icon" class="list__item__metadata__icon" />
    
                            ${repo.forks_count.toLocaleString('en-US')}
                        </p>
                    </div>
                </li>
            `;
	});
}

setUserData(userNickname ?? 'octocat');
renderRepos();
