import React from 'react';
import PropTypes from 'prop-types';
import { compose, withProps } from 'recompose';
import { EuiFlexItem, EuiFlexGroup, EuiFieldText, EuiButton } from '@elastic/eui';
import { get } from 'lodash';
import { createStatefulPropHoc } from '../../components/enhance/stateful_prop';
import { templateFromReactComponent } from '../../lib/template_from_react_component';

const StringArgInput = ({ updateValue, value, confirm, commit, argId }) => (
  <EuiFlexGroup gutterSize="s">
    <EuiFlexItem>
      <EuiFieldText
        id={argId}
        value={value}
        onChange={confirm ? updateValue : ev => commit(ev.target.value)}
      />
    </EuiFlexItem>
    {confirm && (
      <EuiFlexItem grow={false}>
        <EuiButton onClick={() => commit(value)}>{confirm}</EuiButton>
      </EuiFlexItem>
    )}
  </EuiFlexGroup>
);

StringArgInput.propTypes = {
  updateValue: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  confirm: PropTypes.string,
  commit: PropTypes.func.isRequired,
  argId: PropTypes.string.isRequired,
};

const EnhancedStringArgInput = compose(
  withProps(({ onValueChange, typeInstance, argValue }) => ({
    confirm: get(typeInstance, 'options.confirm'),
    commit: onValueChange,
    value: argValue,
  })),
  createStatefulPropHoc('value')
)(StringArgInput);

EnhancedStringArgInput.propTypes = {
  argValue: PropTypes.any.isRequired,
  onValueChange: PropTypes.func.isRequired,
  typeInstance: PropTypes.object.isRequired,
};

export const string = () => ({
  name: 'string',
  displayName: 'string',
  help: 'Input short strings',
  simpleTemplate: templateFromReactComponent(EnhancedStringArgInput),
});
