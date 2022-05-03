import simpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

const axios = require('axios').default;
const gallery = new simpleLightbox('.gallery a');

const refs = {
    form: document.querySelector('.search-form'),
    gallery: document.querySelector('.gallery'),
    loadMoreBtn: document.querySelector('.load-more'),
};
const BASE_URL = 'https://pixabay.com/api/';
const params = {
    key: '26961598-247f7f1db2c0a33756781ca89',
    q: null,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: true,
    per_page: 40,
    page: 1,
};
let resultsCounter = 0;

refs.form.addEventListener('submit', onFormSubmit);
refs.loadMoreBtn.addEventListener('click', onLoadMoreBtnClick);

async function onFormSubmit(event) {
    event.preventDefault();

    hideLoadMoreBtn();
    resetPageNumber();

    const query = event.currentTarget.searchQuery.value;
    if (!checkQuery(query)) {
        return;
    }
    params.q = query;

    try {
        const { images, totalHits } = await fetchImages();

        if (totalHits > 0) {
            Notify.success(`Hooray! We found ${totalHits} images.`);
        }

        resetMarkup();
        renderImages(images);
    } catch (error) {
        alert(error);
    }

    refs.form.reset();
}

async function onLoadMoreBtnClick() {
    incrementPageNumber();

    try {
        const { images } = await fetchImages();
        renderImages(images);
        autoScroll();
    } catch (error) {
        alert(error);
    }
}

async function fetchImages() {
    const response = await axios.get(BASE_URL, { params });

    const totalHits = response.data.totalHits;
    const images = response.data.hits;

    checkMatchingResults(images, totalHits);

    return { images, totalHits };
}

function renderImages(images) {
    const markup = images
        .map(image => {
            const { webformatURL, largeImageURL, tags, likes, views, comments, downloads } = image;
            return `<div class="photo-card">
            <a href="${largeImageURL}">
    <img src="${webformatURL}" alt="${tags}" loading="lazy" />
  <div class="info">
    <p class="info-item">
      <b>Likes</b>
      <span>${likes}</span>
    </p>
    <p class="info-item">
      <b>Views</b>
      <span>${views}</span>
    </p>
    <p class="info-item">
      <b>Comments</b>
      <span>${comments}</span>
    </p>
    <p class="info-item">
      <b>Downloads</b>
      <span>${downloads}</span>
    </p>
  </div>
  </a>
</div>`;
        })
        .join('');

    refs.gallery.insertAdjacentHTML('beforeend', markup);

    gallery.refresh();
}

function resetMarkup() {
    refs.gallery.innerHTML = '';
}

function checkMatchingResults(resultsArray, totalResults) {
    const resultsPerRequest = resultsArray.length;
    resultsCounter += resultsPerRequest;

    if (totalResults === 0) {
        Notify.failure('Sorry, there are no images matching your search query. Please try again.');
        return;
    }
    if (totalResults <= resultsCounter) {
        setTimeout(() => {
            Notify.info("We're sorry, but you've reached the end of search results.");
        }, 300);
        hideLoadMoreBtn();
        return;
    }
    showLoadMoreBtn();
}

function showLoadMoreBtn() {
    if (refs.gallery.innerHTML === '' && refs.loadMoreBtn.classList.contains('is-hidden')) {
        return;
    }

    refs.loadMoreBtn.classList.remove('is-hidden');
}

function hideLoadMoreBtn() {
    refs.loadMoreBtn.classList.add('is-hidden');
}

function checkQuery(query) {
    if (query) {
        return true;
    }
    Notify.warning('Please enter your query first');
    return false;
}

function resetPageNumber() {
    params.page = 1;
    resultsCounter = 0;
}

function incrementPageNumber() {
    params.page += 1;
}

function autoScroll() {
    const { height: cardHeight } = document
        .querySelector('.gallery')
        .firstElementChild.getBoundingClientRect();

    window.scrollBy({
        top: cardHeight * 2,
        behavior: 'smooth',
    });
}
