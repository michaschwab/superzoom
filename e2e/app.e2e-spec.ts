import { SuperzoomPage } from './app.po';

describe('superzoom App', () => {
  let page: SuperzoomPage;

  beforeEach(() => {
    page = new SuperzoomPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
