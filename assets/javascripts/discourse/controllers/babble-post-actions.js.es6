import ModalFunctionality from 'discourse/mixins/modal-functionality'
import Babble from '../lib/babble'
import computed from 'ember-addons/ember-computed-decorators'
import { userPath } from 'discourse/lib/url'

export default Ember.Controller.extend(ModalFunctionality, {
  topic: null,
  post: null,
  post_name: '',
  post_quote: '',

  @computed('post_name')
  post_user_url(post_name) {
    return userPath(post_name)
  },

  actions: {
    reply() {
      this.appEvents.trigger('babble-composer:reply', this.get('post').get('post_number'))
      this.send('closeModal')
    },
    edit() {
      Babble.editPost(this.get('topic'), this.get('post'))
      this.send('closeModal')
    },
    delete() {
      Babble.destroyPost(this.get('topic'), this.get('post'))
      this.send('closeModal')
    }
  }
})